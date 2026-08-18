const mongoose = require('mongoose');

// Mock auth middleware for development
const authMiddleware = (req, res, next) => {
  // Use headers if provided, otherwise default to a standard clinic/user
  const clinicId = req.headers['x-clinic-id'] || '60c72b2f9b1d8b2bad000001';
  const role = req.headers['x-user-role'] || 'admin';
  const isOwner = req.headers['x-user-is-owner'] === 'false' ? false : true; // default true
  const userId = req.headers['x-user-id'] || '60c72b2f9b1d8b2bad000002';

  req.user = {
    clinicId,
    role,
    isOwner,
    userId
  };

  next();
};

// Middleware to enforce isOwner === true
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
