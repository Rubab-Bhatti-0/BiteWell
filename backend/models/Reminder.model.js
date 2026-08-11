const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  patientName: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  installmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Installment', default: null },
  type: {
    type: String,
    enum: ['visit_upcoming', 'payment_due', 'payment_overdue', 'custom'],
    required: true,
    index: true
  },
  channel: {
    type: String,
    enum: ['sms', 'whatsapp'],
    required: true,
    index: true
  },
  message: { type: String, required: true, trim: true, maxlength: 1500 },
  scheduledFor: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  providerMessageId: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  deduplicationKey: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ReminderSchema.index(
  { clinicId: 1, deduplicationKey: 1 },
  { unique: true }
);
ReminderSchema.index({ clinicId: 1, status: 1, scheduledFor: 1 });

module.exports = mongoose.models.Reminder
  || mongoose.model('Reminder', ReminderSchema);
