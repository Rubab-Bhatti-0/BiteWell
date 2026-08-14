const mongoose = require('mongoose');
const Appointment = require('../models/Appointment.model');
const Reminder = require('../models/Reminder.model');
const Patient = require('../models/Patient.model');
const scopedQuery = require('../utils/scopedQuery');
const { reminderDeduplicationKey, normalizePhone } = require('../utils/scheduling');

const DAY_MS = 24 * 60 * 60 * 1000;

async function upsertGeneratedReminder(req, payload) {
  const existing = await scopedQuery.findOne(req, Reminder, {
    deduplicationKey: payload.deduplicationKey
  });

  if (existing) {
    if (['pending', 'failed'].includes(existing.status)) {
      existing.patientName = payload.patientName;
      existing.destination = payload.destination;
      existing.message = payload.message;
      existing.scheduledFor = payload.scheduledFor;
      existing.status = 'pending';
      existing.lastError = '';
      await existing.save();
    }
    return { created: false, reminder: existing };
  }

  try {
    const reminder = await Reminder.create({
      ...payload,
      clinicId: req.user.clinicId,
      createdBy: req.user.userId
    });
    return { created: true, reminder };
  } catch (error) {
    if (error.code === 11000) {
      const reminder = await scopedQuery.findOne(req, Reminder, {
        deduplicationKey: payload.deduplicationKey
      });
      return { created: false, reminder };
    }
    throw error;
  }
}

async function syncVisitReminders(req, { channel = 'sms', daysAhead = 7 } = {}) {
  const now = new Date();
  const horizon = new Date(now.getTime() + daysAhead * DAY_MS);
  const appointments = await scopedQuery(req, Appointment, {
    startAt: { $gte: now, $lte: horizon },
    status: { $in: ['scheduled', 'confirmed'] }
  }).sort({ startAt: 1 });

  let created = 0;
  let skipped = 0;

  for (const appointment of appointments) {
    const destination = normalizePhone(appointment.patientPhone);
    if (!destination) {
      skipped += 1;
      continue;
    }
    const scheduledForCandidate = new Date(appointment.startAt.getTime() - DAY_MS);
    const scheduledFor = scheduledForCandidate > now ? scheduledForCandidate : now;
    const result = await upsertGeneratedReminder(req, {
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      destination,
      appointmentId: appointment._id,
      type: 'visit_upcoming',
      channel,
      message: `DentalPay reminder: ${appointment.patientName}, your ${appointment.title} appointment is on ${appointment.startAt.toLocaleString('en-PK', { timeZone: appointment.timezone })}.`,
      scheduledFor,
      deduplicationKey: reminderDeduplicationKey({
        type: 'visit_upcoming',
        sourceId: appointment._id,
        channel
      })
    });
    if (result.created) created += 1;
  }

  return { scanned: appointments.length, created, skipped };
}

async function syncPaymentReminders(req, { channel = 'sms', daysAhead = 7 } = {}) {
  const now = new Date();
  const horizon = new Date(now.getTime() + daysAhead * DAY_MS);
  const clinicObjectId = new mongoose.Types.ObjectId(req.user.clinicId);

  // This is a read-only adapter for Person 2's future Installment collection.
  // No competing Installment schema is declared in this module.
  const installments = await mongoose.connection.db
    .collection('installments')
    .find({
      clinicId: clinicObjectId,
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lte: horizon }
    })
    .sort({ dueDate: 1 })
    .limit(500)
    .toArray();

  const patientIds = installments
    .map((installment) => installment.patientId)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  const patients = patientIds.length
    ? await scopedQuery(req, Patient, { _id: { $in: patientIds } })
    : [];
  const patientById = new Map(patients.map((patient) => [String(patient._id), patient]));

  let created = 0;
  let skipped = 0;

  for (const installment of installments) {
    const patient = patientById.get(String(installment.patientId));
    const destination = normalizePhone(patient && patient.phone);
    const dueDate = new Date(installment.dueDate);
    if (!patient || !destination || Number.isNaN(dueDate.getTime())) {
      skipped += 1;
      continue;
    }

    const overdue = installment.status === 'overdue' || dueDate < now;
    const type = overdue ? 'payment_overdue' : 'payment_due';
    if (overdue) {
      await Reminder.updateMany(
        scopedQuery.filter(req, {
          installmentId: installment._id,
          type: 'payment_due',
          status: { $in: ['pending', 'failed'] }
        }),
        { $set: { status: 'cancelled' } }
      );
    }

    const amount = Number(installment.amount || 0);
    const amountText = amount
      ? `PKR ${amount.toLocaleString('en-PK')}`
      : 'your installment';
    const message = overdue
      ? `DentalPay reminder: ${patient.name}, ${amountText} was due on ${dueDate.toLocaleDateString('en-PK')}. Please contact the clinic.`
      : `DentalPay reminder: ${patient.name}, ${amountText} is due on ${dueDate.toLocaleDateString('en-PK')}.`;
    const scheduledCandidate = new Date(dueDate.getTime() - DAY_MS);
    const scheduledFor = overdue || scheduledCandidate < now ? now : scheduledCandidate;

    const result = await upsertGeneratedReminder(req, {
      patientId: patient._id,
      patientName: patient.name,
      destination,
      installmentId: installment._id,
      type,
      channel,
      message,
      scheduledFor,
      deduplicationKey: reminderDeduplicationKey({
        type,
        sourceId: installment._id,
        channel
      })
    });
    if (result.created) created += 1;
  }

  return { scanned: installments.length, created, skipped };
}

module.exports = {
  upsertGeneratedReminder,
  syncVisitReminders,
  syncPaymentReminders
};
