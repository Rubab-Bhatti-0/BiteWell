const mongoose = require('mongoose');
const Appointment = require('../models/Appointment.model');
const Reminder = require('../models/Reminder.model');
const ActivityLog = require('../models/ActivityLog.model');
const scopedQuery = require('../utils/scopedQuery');
const { asValidDate } = require('../utils/scheduling');

function parseRange(query, defaultDays = 30) {
  const from = query.from ? asValidDate(query.from) : new Date();
  const to = query.to
    ? asValidDate(query.to)
    : new Date(from.getTime() + defaultDays * 24 * 60 * 60 * 1000);
  if (!from || !to || to <= from) return null;
  return { from, to };
}

async function getSchedulingDashboard(req, res) {
  try {
    const range = parseRange(req.query, 1);
    if (!range) return res.status(400).json({ error: 'Invalid dashboard date range.' });

    const upcomingVisits = await scopedQuery(req, Appointment, {
      startAt: { $gte: range.from, $lt: range.to },
      status: { $in: ['scheduled', 'confirmed', 'checked_in'] }
    })
      .sort({ startAt: 1 })
      .limit(8);
    const recentActivity = await scopedQuery(req, ActivityLog)
      .sort({ createdAt: -1 })
      .limit(10);
    const pendingReminders = await scopedQuery.countDocuments(req, Reminder, {
      status: { $in: ['pending', 'failed'] }
    });

    return res.json({ upcomingVisits, recentActivity, pendingReminders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getSchedulingReport(req, res) {
  try {
    const range = parseRange(req.query, 30);
    if (!range) return res.status(400).json({ error: 'Invalid report date range.' });
    const clinicId = new mongoose.Types.ObjectId(req.user.clinicId);

    const [appointmentSummary, reminderSummary, appointments, reminders] = await Promise.all([
      Appointment.aggregate([
        {
          $match: {
            clinicId,
            startAt: { $gte: range.from, $lt: range.to }
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Reminder.aggregate([
        {
          $match: {
            clinicId,
            scheduledFor: { $gte: range.from, $lt: range.to }
          }
        },
        {
          $group: {
            _id: { status: '$status', type: '$type', channel: '$channel' },
            count: { $sum: 1 }
          }
        }
      ]),
      scopedQuery(req, Appointment, {
        startAt: { $gte: range.from, $lt: range.to }
      }).sort({ startAt: 1 }).limit(1000),
      scopedQuery(req, Reminder, {
        scheduledFor: { $gte: range.from, $lt: range.to }
      }).sort({ scheduledFor: 1 }).limit(1000)
    ]);

    return res.json({
      range,
      appointmentSummary,
      reminderSummary,
      appointments,
      reminders
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getSchedulingDashboard, getSchedulingReport };
