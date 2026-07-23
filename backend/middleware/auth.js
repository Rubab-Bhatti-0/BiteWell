const mongoose = require('mongoose');

const authMiddleware = (req, res, next) => {
  // Group 1 will replace this branch with verified JWT middleware.
  if (process.env.AUTH_MODE !== 'mock') {
    if (!req.user?.clinicId) {
      return res.status(401).json({
        error: 'Authentication middleware is not connected. Use AUTH_MODE=mock only for local development.'
      });
    }
    return next();
  }

  const clinicId = req.headers['x-clinic-id'] || '60c72b2f9b1d8b2bad000001';
  const role = req.headers['x-user-role'] || 'admin';
  const isOwner = req.headers['x-user-is-owner'] !== 'false';
  const userId = req.headers['x-user-id'] || '60c72b2f9b1d8b2bad000002';

  if (!mongoose.Types.ObjectId.isValid(clinicId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Mock clinic/user headers must contain valid ObjectIds.' });
  }

  req.user = {
    clinicId,
    role,
    isOwner,
    userId
  };

  next();
};

const requireOwner = (req, res, next) => {
  if (!req.user || !req.user.isOwner) {
    return res.status(403).json({ error: 'Access denied: requires clinic owner privileges.' });
  }
  next();
};

module.exports = {
  authMiddleware,
  requireOwner
};
