const mongoose = require('mongoose');
const Reminder = require('../models/Reminder.model');
const Patient = require('../models/Patient.model');
const scopedQuery = require('../utils/scopedQuery');
const { recordActivity } = require('../services/activity.service');
const { sendReminder } = require('../services/twilio.service');
const {
  syncVisitReminders,
  syncPaymentReminders
} = require('../services/reminder.service');
const {
  reminderDeduplicationKey,
  normalizePhone,
  asValidDate
} = require('../utils/scheduling');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

async function listReminders(req, res) {
  try {
    const { status, type, channel, from, to, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (channel && channel !== 'all') filter.channel = channel;
    if (from || to) {
      filter.scheduledFor = {};
      if (from) {
        const date = asValidDate(from);
        if (!date) return res.status(400).json({ error: 'Invalid from date.' });
        filter.scheduledFor.$gte = date;
      }
      if (to) {
        const date = asValidDate(to);
        if (!date) return res.status(400).json({ error: 'Invalid to date.' });
        filter.scheduledFor.$lt = date;
      }
    }

    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 500);
    const total = await scopedQuery.countDocuments(req, Reminder, filter);
    const data = await scopedQuery(req, Reminder, filter)
      .sort({ scheduledFor: 1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);
    return res.json({
      data,
      total,
      page: currentPage,
      pages: Math.max(Math.ceil(total / pageSize), 1)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createCustomReminder(req, res) {
  try {
    const {
      patientId,
      channel = 'sms',
      message,
      scheduledFor = new Date()
    } = req.body;
    if (!isValidObjectId(patientId)) {
      return res.status(400).json({ error: 'Valid patientId is required.' });
    }
    if (!['sms', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ error: 'Channel must be sms or whatsapp.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reminder message is required.' });
    }
    const schedule = asValidDate(scheduledFor);
    if (!schedule) return res.status(400).json({ error: 'Invalid scheduled date/time.' });

    const patient = await scopedQuery.findOne(req, Patient, { _id: patientId });
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    const destination = normalizePhone(patient.phone);
    if (!destination) {
      return res.status(400).json({ error: 'The patient does not have a phone number.' });
    }

    const reminder = await Reminder.create({
      clinicId: req.user.clinicId,
      patientId: patient._id,
      patientName: patient.name,
      destination,
      type: 'custom',
      channel,
      message: message.trim(),
      scheduledFor: schedule,
      deduplicationKey: reminderDeduplicationKey({
        type: 'custom',
        channel,
        scheduledFor: schedule.toISOString(),
        message: message.trim()
      }),
      createdBy: req.user.userId
    });

    await recordActivity(req, {
      action: 'reminder_created',
      entityType: 'Reminder',
      entityId: reminder._id,
      description: `Custom ${channel} reminder created for ${patient.name}.`
    });
    return res.status(201).json(reminder);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An identical reminder already exists.' });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function syncReminders(req, res) {
  try {
    const channel = req.body.channel || 'sms';
    const daysAhead = Math.min(Math.max(Number(req.body.daysAhead) || 7, 1), 30);
    if (!['sms', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ error: 'Channel must be sms or whatsapp.' });
    }

    const visits = await syncVisitReminders(req, { channel, daysAhead });
    const payments = await syncPaymentReminders(req, { channel, daysAhead });
    return res.json({ visits, payments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function sendOneReminder(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid reminder ID.' });
    }
    const existing = await scopedQuery.findOne(req, Reminder, { _id: req.params.id });
    if (!existing) return res.status(404).json({ error: 'Reminder not found.' });
    if (existing.status === 'sent') {
      return res.status(409).json({ error: 'This reminder was already sent.' });
    }
    if (existing.status === 'cancelled') {
      return res.status(409).json({ error: 'A cancelled reminder cannot be sent.' });
    }
    if (existing.status === 'sending') {
      return res.status(409).json({ error: 'This reminder is already being sent.' });
    }

    const reminder = await Reminder.findOneAndUpdate(
      scopedQuery.filter(req, {
        _id: existing._id,
        status: { $in: ['pending', 'failed'] }
      }),
      { $set: { status: 'sending', lastError: '' } },
      { new: true }
    );
    if (!reminder) {
      return res.status(409).json({ error: 'Reminder status changed; refresh and retry.' });
    }

    try {
      const result = await sendReminder({
        channel: reminder.channel,
        destination: reminder.destination,
        message: reminder.message
      });
      reminder.status = 'sent';
      reminder.sentAt = new Date();
      reminder.providerMessageId = result.providerMessageId;
      reminder.lastError = '';
      await reminder.save();

      await recordActivity(req, {
        action: 'reminder_sent',
        entityType: 'Reminder',
        entityId: reminder._id,
        description: `${reminder.channel.toUpperCase()} reminder sent to ${reminder.patientName}.`,
        metadata: { type: reminder.type, mock: Boolean(result.mock) }
      });
      return res.json(reminder);
    } catch (sendError) {
      reminder.status = 'failed';
      reminder.lastError = sendError.message;
      await reminder.save();
      return res.status(502).json({
        error: sendError.message,
        reminder
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function cancelReminder(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid reminder ID.' });
    }
    const reminder = await scopedQuery.findOne(req, Reminder, { _id: req.params.id });
    if (!reminder) return res.status(404).json({ error: 'Reminder not found.' });
    if (reminder.status === 'sent') {
      return res.status(409).json({ error: 'A sent reminder cannot be cancelled.' });
    }
    reminder.status = 'cancelled';
    await reminder.save();
    return res.json(reminder);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listReminders,
  createCustomReminder,
  syncReminders,
  sendOneReminder,
  cancelReminder
};
