const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  patientName: { type: String, required: true, trim: true },
  patientPhone: { type: String, default: '', trim: true },
  doctorName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  treatmentName: { type: String, default: '', trim: true, maxlength: 120 },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true },
  timezone: { type: String, default: 'Asia/Karachi', trim: true },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
    index: true
  },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

AppointmentSchema.pre('validate', function validateTimes() {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    this.invalidate('endAt', 'Appointment end time must be after its start time.');
  }
});

AppointmentSchema.index({
  clinicId: 1,
  doctorId: 1,
  startAt: 1,
  endAt: 1,
  status: 1
});
AppointmentSchema.index({ clinicId: 1, patientId: 1, startAt: 1 });

module.exports = mongoose.models.Appointment
  || mongoose.model('Appointment', AppointmentSchema);
