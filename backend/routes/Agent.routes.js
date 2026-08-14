const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  listAgents,
  enableAgent,
  disableAgent,
  getAgentAnalytics
} = require('../controllers/Agent.controller');

const router = express.Router();
router.use(authMiddleware);

// Agent management
router.get('/agents', listAgents);
router.post('/clinic/agents/:id/enable', enableAgent);
router.post('/clinic/agents/:id/disable', disableAgent);

// Analytics
router.get('/analytics/agents', getAgentAnalytics);

module.exports = router;