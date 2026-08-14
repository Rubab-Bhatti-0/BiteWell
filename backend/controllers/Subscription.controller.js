const Clinic = require('../models/Clinic');

// POST /api/subscription/downgrade - downgrade clinic subscription plan
async function downgradeSubscription(req, res) {
  try {
    const { planName = 'free', maxAgents = 1 } = req.body;

    const clinic = await Clinic.findById(req.user.clinicId);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found.' });
    }

    // Get currently enabled agents
    const enabledAgents = clinic.enabledAgents || [];

    // Determine which agents need to be disabled based on new plan limit
    const disabledAgents = enabledAgents.slice(maxAgents);

    // Update clinic
    clinic.subscriptionPlan = planName;
    clinic.subscriptionStatus = 'active';
    clinic.enabledAgents = enabledAgents.slice(0, maxAgents);
    await clinic.save();

    return res.json({
      success: true,
      message: `Downgraded to ${planName} plan.`,
      disabledAgents,
      planName,
      maxAgents
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  downgradeSubscription
};