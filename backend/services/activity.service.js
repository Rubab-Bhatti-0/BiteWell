const ActivityLog = require('../models/ActivityLog.model');

async function recordActivity(req, {
  action,
  entityType,
  entityId,
  description,
  metadata = {}
}) {
  try {
    return await ActivityLog.create({
      clinicId: req.user.clinicId,
      userId: req.user.userId,
      action,
      entityType,
      entityId,
      description,
      metadata
    });
  } catch (error) {
    // A failed audit write should be visible in logs without hiding the primary action.
    console.error('Activity log write failed:', error.message);
    return null;
  }
}

module.exports = { recordActivity };
