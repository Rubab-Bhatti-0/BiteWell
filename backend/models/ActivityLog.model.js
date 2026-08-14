const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9]+(?:_[a-z0-9]+)*$/, 'Activity action must use snake_case.']
  },
  entityType: { type: String, required: true, trim: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

ActivityLogSchema.index({ clinicId: 1, createdAt: -1 });
ActivityLogSchema.index({ clinicId: 1, action: 1, createdAt: -1 });

module.exports = mongoose.models.ActivityLog
  || mongoose.model('ActivityLog', ActivityLogSchema);
