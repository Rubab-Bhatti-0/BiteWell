const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
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
  defaultCost: {
    type: Number,
    required: true,
    min: 0.01
  },
  category: {
    type: String,
    trim: true,
    maxlength: 80,
    default: 'General'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

treatmentSchema.index({ clinicId: 1, name: 1 }, { unique: true });
treatmentSchema.index({ clinicId: 1, isActive: 1, name: 1 });

module.exports = mongoose.model('Treatment', treatmentSchema);
