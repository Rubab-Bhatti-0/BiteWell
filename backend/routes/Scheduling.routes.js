const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getSchedulingDashboard,
  getSchedulingReport
} = require('../controllers/Scheduling.controller');

const router = express.Router();
router.use(authMiddleware);

router.get('/dashboard', getSchedulingDashboard);
router.get('/reports', getSchedulingReport);

module.exports = router;
