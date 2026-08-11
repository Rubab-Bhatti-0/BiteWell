const mongoose = require('mongoose');
const Appointment = require('../models/Appointment.model');
const Patient = require('../models/Patient.model');
const scopedQuery = require('../utils/scopedQuery');
const { recordActivity } = require('../services/activity.service');
const {
  INACTIVE_APPOINTMENT_STATUSES,
  validateAppointmentRange
} = require('../utils/scheduling');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

async function findPatient(req, patientId) {
  if (!isValidObjectId(patientId)) return null;
  return scopedQuery.findOne(req, Patient, { _id: patientId });
}

async function findConflict(req, { doctorId, startAt, endAt, excludeId }) {
  const filter = {
    doctorId,
    status: { $nin: INACTIVE_APPOINTMENT_STATUSES },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt }
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return scopedQuery.findOne(req, Appointment, filter);
}

async function createAppointment(req, res) {
  try {
    const {
      patientId,
      doctorId = req.user.userId,
      doctorName = 'Clinic Doctor',
      title,
      treatmentName = '',
      startAt,
      endAt,
      timezone = 'Asia/Karachi',
      status = 'scheduled',
      notes = ''
    } = req.body;

    if (!patientId || !title || !doctorId) {
      return res.status(400).json({
        error: 'patientId, doctorId and title are required.'
      });
    }
    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ error: 'Invalid doctor ID.' });
    }

    const range = validateAppointmentRange(startAt, endAt);
    if (!range.valid) return res.status(400).json({ error: range.error });

    const patient = await findPatient(req, patientId);
    if (!patient) {
      return res.status(404).json({
        error: 'Patient was not found in the authenticated clinic.'
      });
    }

    const conflict = await findConflict(req, {
      doctorId,
      startAt: range.start,
      endAt: range.end
    });
    if (conflict) {
      return res.status(409).json({
        error: 'This doctor already has an appointment during the selected time.',
        conflict
      });
    }

    const appointment = await Appointment.create({
      clinicId: req.user.clinicId,
      patientId: patient._id,
      doctorId,
      patientName: patient.name,
      patientPhone: patient.phone || '',
      doctorName,
      title,
      treatmentName,
      startAt: range.start,
      endAt: range.end,
      timezone,
      status,
      notes,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    await recordActivity(req, {
      action: 'appointment_created',
      entityType: 'Appointment',
      entityId: appointment._id,
      description: `Appointment booked for ${appointment.patientName}.`,
      metadata: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        startAt: appointment.startAt
      }
    });

    return res.status(201).json(appointment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function listAppointments(req, res) {
  try {
    const {
      from,
      to,
      status,
      doctorId,
      patientId,
      search,
      page = 1,
      limit = 100
    } = req.query;
    const filter = {};

    if (from || to) {
      filter.startAt = {};
      if (from) {
        const parsedFrom = new Date(from);
        if (Number.isNaN(parsedFrom.getTime())) {
          return res.status(400).json({ error: 'Invalid from date.' });
        }
        filter.startAt.$gte = parsedFrom;
      }
      if (to) {
        const parsedTo = new Date(to);
        if (Number.isNaN(parsedTo.getTime())) {
          return res.status(400).json({ error: 'Invalid to date.' });
        }
        filter.startAt.$lt = parsedTo;
      }
    }
    if (status && status !== 'all') filter.status = status;
    if (doctorId) {
      if (!isValidObjectId(doctorId)) {
        return res.status(400).json({ error: 'Invalid doctor ID.' });
      }
      filter.doctorId = doctorId;
    }
    if (patientId) {
      if (!isValidObjectId(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID.' });
      }
      filter.patientId = patientId;
    }
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { patientName: new RegExp(escaped, 'i') },
        { doctorName: new RegExp(escaped, 'i') },
        { title: new RegExp(escaped, 'i') }
      ];
    }

    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 500);
    const total = await scopedQuery.countDocuments(req, Appointment, filter);
    const data = await scopedQuery(req, Appointment, filter)
      .sort({ startAt: 1 })
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

async function getAppointment(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid appointment ID.' });
    }
    const appointment = await scopedQuery.findOne(req, Appointment, {
      _id: req.params.id
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateAppointment(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid appointment ID.' });
    }
    const appointment = await scopedQuery.findOne(req, Appointment, {
      _id: req.params.id
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

    const nextPatientId = req.body.patientId || appointment.patientId;
    const nextDoctorId = req.body.doctorId || appointment.doctorId;
    const nextStartAt = req.body.startAt || appointment.startAt;
    const nextEndAt = req.body.endAt || appointment.endAt;
    const nextStatus = req.body.status || appointment.status;

    if (!isValidObjectId(nextDoctorId)) {
      return res.status(400).json({ error: 'Invalid doctor ID.' });
    }
    const range = validateAppointmentRange(nextStartAt, nextEndAt);
    if (!range.valid) return res.status(400).json({ error: range.error });

    if (!INACTIVE_APPOINTMENT_STATUSES.includes(nextStatus)) {
      const conflict = await findConflict(req, {
        doctorId: nextDoctorId,
        startAt: range.start,
        endAt: range.end,
        excludeId: appointment._id
      });
      if (conflict) {
        return res.status(409).json({
          error: 'This doctor already has an appointment during the selected time.',
          conflict
        });
      }
    }

    if (String(nextPatientId) !== String(appointment.patientId)) {
      const patient = await findPatient(req, nextPatientId);
      if (!patient) {
        return res.status(404).json({
          error: 'Patient was not found in the authenticated clinic.'
        });
      }
      appointment.patientId = patient._id;
      appointment.patientName = patient.name;
      appointment.patientPhone = patient.phone || '';
    }

    const editableFields = [
      'doctorName',
      'title',
      'treatmentName',
      'timezone',
      'status',
      'notes'
    ];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) appointment[field] = req.body[field];
    });
    appointment.doctorId = nextDoctorId;
    appointment.startAt = range.start;
    appointment.endAt = range.end;
    appointment.updatedBy = req.user.userId;
    await appointment.save();

    await recordActivity(req, {
      action: 'appointment_updated',
      entityType: 'Appointment',
      entityId: appointment._id,
      description: `Appointment updated for ${appointment.patientName}.`,
      metadata: { status: appointment.status, startAt: appointment.startAt }
    });

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function cancelAppointment(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid appointment ID.' });
    }
    const appointment = await scopedQuery.findOne(req, Appointment, {
      _id: req.params.id
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

    appointment.status = 'cancelled';
    appointment.updatedBy = req.user.userId;
    if (req.body.reason) {
      appointment.notes = [appointment.notes, `Cancellation: ${req.body.reason}`]
        .filter(Boolean)
        .join('\n');
    }
    await appointment.save();

    await recordActivity(req, {
      action: 'appointment_cancelled',
      entityType: 'Appointment',
      entityId: appointment._id,
      description: `Appointment cancelled for ${appointment.patientName}.`
    });

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getNextPatientVisit(req, res) {
  try {
    if (!isValidObjectId(req.params.patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID.' });
    }
    const appointment = await scopedQuery.findOne(req, Appointment, {
      patientId: req.params.patientId,
      startAt: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed', 'checked_in'] }
    }).sort({ startAt: 1 });

    return res.json({ appointment: appointment || null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  getNextPatientVisit
};
