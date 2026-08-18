const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');

// Static catalog of available AI agents
const AGENT_CATALOG = [
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    description: 'Automatically reminds patients about appointments',
    category: 'Communication',
    enabled: false
  },
  {
    id: 'invoice-assistant',
    name: 'Invoice Assistant',
    description: 'Helps manage billing queries',
    category: 'Finance',
    enabled: false
  },
  {
    id: 'patient-chatbot',
    name: 'Patient Chatbot',
    description: 'Answers patient questions',
    category: 'Communication',
    enabled: true
  },
  {
    id: 'treatment-recommendation',
    name: 'Treatment Recommendation',
    description: 'Suggests treatment options',
    category: 'Clinical',
    enabled: false
  },
  {
    id: 'scheduling-assistant',
    name: 'Scheduling Assistant',
    description: 'Automates appointment scheduling and rescheduling',
    category: 'Communication',
    enabled: false
  },
  {
    id: 'billing-assistant',
    name: 'Billing Assistant',
    description: 'Handles billing queries and payment follow-ups',
    category: 'Finance',
    enabled: false
  },
  {
    id: 'intake-summarizer',
    name: 'Intake Summarizer',
    description: 'Generates patient intake summaries',
    category: 'Clinical',
    enabled: false
  }
];

// Helper to get enabled agent IDs for a clinic
async function getEnabledAgentIds(clinicId) {
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return [];
  return clinic.enabledAgents || [];
}

// GET /api/agents - list all agents with enabled state for the clinic
async function listAgents(req, res) {
  try {
    const enabledIds = await getEnabledAgentIds(req.user.clinicId);
    const agents = AGENT_CATALOG.map(agent => ({
      ...agent,
      enabled: enabledIds.includes(agent.id)
    }));
    return res.json(agents);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/clinic/agents/:id/enable - enable an agent
async function enableAgent(req, res) {
  try {
    const { id } = req.params;
    const agent = AGENT_CATALOG.find(a => a.id === id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    const clinic = await Clinic.findById(req.user.clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found.' });
    }

    // Check plan limits
    const planLimits = { free: 1, standard: 3, premium: 10 };
    const maxAgents = planLimits[clinic.subscriptionPlan] || 1;
    const enabledIds = clinic.enabledAgents || [];
    
    if (enabledIds.length >= maxAgents && !enabledIds.includes(id)) {
      return res.status(400).json({
        success: false,
        message: `Maximum AI agents reached for your ${clinic.subscriptionPlan} plan. Upgrade your subscription.`
      });
    }

    if (!enabledIds.includes(id)) {
      clinic.enabledAgents = [...enabledIds, id];
      await clinic.save();
    }

    return res.json({ success: true, agent: { ...agent, enabled: true } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/clinic/agents/:id/disable - disable an agent
async function disableAgent(req, res) {
  try {
    const { id } = req.params;
    const agent = AGENT_CATALOG.find(a => a.id === id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    const clinic = await Clinic.findById(req.user.clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found.' });
    }

    const enabledIds = clinic.enabledAgents || [];
    clinic.enabledAgents = enabledIds.filter(agentId => agentId !== id);
    await clinic.save();

    return res.json({ success: true, agent: { ...agent, enabled: false } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/analytics/agents - get agent usage analytics
async function getAgentAnalytics(req, res) {
  try {
    const enabledIds = await getEnabledAgentIds(req.user.clinicId);
    const activeAgents = AGENT_CATALOG.filter(a => enabledIds.includes(a.id));

    // Mock analytics data (would be replaced with real usage tracking)
    const dailyUsage = [
      { date: 'Mon', count: 120 },
      { date: 'Tue', count: 180 },
      { date: 'Wed', count: 150 },
      { date: 'Thu', count: 210 },
      { date: 'Fri', count: 190 },
      { date: 'Sat', count: 90 },
      { date: 'Sun', count: 344 }
    ];

    const usageByAgent = activeAgents.map((agent, index) => ({
      name: agent.name,
      totalRequests: 100 + index * 75
    }));

    return res.json({
      totalRequests: dailyUsage.reduce((sum, d) => sum + d.count, 0),
      mostUsedAgent: activeAgents[0] || { name: 'N/A' },
      activeAgents: activeAgents.length,
      dailyUsage,
      usageByAgent
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listAgents,
  enableAgent,
  disableAgent,
  getAgentAnalytics
};