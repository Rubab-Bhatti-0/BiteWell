import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Verify user token & authenticate requests
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (populate clinic details)
      req.user = await User.findById(decoded.id).select('-passwordHash').populate('clinicId');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (!req.user.isActive) {
        return res.status(403).json({ message: 'User account has been deactivated' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// @desc    Restrict access based on staff roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to perform this action' 
      });
    }
    next();
  };
};

// @desc    Restrict access based on subscription tiers (free, standard, premium)
export const checkSubscription = (...allowedPlans) => {
  return (req, res, next) => {
    if (!req.user || !req.user.clinicId) {
      return res.status(400).json({ message: 'Clinic association not found' });
    }

    const plan = req.user.clinicId.subscriptionPlan || 'free';
    const status = req.user.clinicId.subscriptionStatus || 'active';

    if (status !== 'active') {
      return res.status(403).json({ 
        message: `Subscription issue: Your status is currently ${status}. Please update payment details.` 
      });
    }

    if (!allowedPlans.includes(plan)) {
      return res.status(403).json({ 
        message: `Upgrade Required: This feature is only available on ${allowedPlans.join(' or ')} plans.` 
      });
    }

    next();
  };
};
