const mongoose = require('mongoose');

const TOOTH_CONDITIONS = [
  'Healthy',
  'Decayed',
  'Filled',
  'Crown',
  'Bridge',
  'Missing'
];

const toothEntrySchema = new mongoose.Schema({
  toothNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 32
  },
  condition: {
    type: String,
    enum: TOOTH_CONDITIONS,
    default: 'Healthy'
  },
  treatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  }
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'pdf'], required: true },
  originalName: { type: String, trim: true, default: '' },
  mimeType: { type: String, trim: true, default: '' },
  size: { type: Number, min: 0 },
  uploadedAt: { type: Date, default: Date.now }
});

const patientSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 254,
    default: ''
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  bloodGroup: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 5,
    default: ''
  },
  allergies: {
    type: [String],
    default: []
  },
  medicalConditions: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 5000,
    default: ''
  },
  status: {
    type: String,
    enum: ['cleared', 'uncleared'],
    default: 'uncleared',
    index: true
  },
  toothChart: {
    type: [toothEntrySchema],
    default: []
  },
  attachments: {
    type: [attachmentSchema],
    default: []
  }
}, { timestamps: true });

patientSchema.index({ clinicId: 1, name: 1 });
patientSchema.index({ clinicId: 1, phone: 1 }, { unique: true });
patientSchema.index({ clinicId: 1, status: 1, createdAt: -1 });

patientSchema.statics.toothConditions = TOOTH_CONDITIONS;

module.exports = mongoose.model('Patient', patientSchema);
