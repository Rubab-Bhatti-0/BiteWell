const express = require('express');
const router = express.Router();
const { Package, ClinicSubscription, SubscriptionInvoice } = require('../models/Subscription');

// Seed default packages if empty
async function ensurePackages() {
  const count = await Package.countDocuments();
  if (count === 0) {
    await Package.insertMany([
      { name: "Starter", description: "Essential practice management for solo dentists", priceMonthly: 49.00, maxAgents: 1, features: ["Patient Records", "Tooth Chart", "Installment Tracking", "1 AI Agent"] },
      { name: "Professional", description: "Full multi-doctor clinic suite with advanced analytics", priceMonthly: 129.00, maxAgents: 3, features: ["Everything in Starter", "Appointment Scheduling", "WhatsApp Reminders", "3 AI Agents", "Financial Growth Reports"] },
      { name: "Enterprise", description: "Unlimited AI agents & priority 24/7 support", priceMonthly: 299.00, maxAgents: 10, features: ["Everything in Professional", "Unlimited AI Agents", "Multi-Location Support", "Custom API Access", "Dedicated Account Manager"] }
    ]);
  }
}

// Get packages
router.get('/packages', async (req, res) => {
  try {
    await ensurePackages();
    const pkgs = await Package.find();
    res.json(pkgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current active subscription for clinicId 1
router.get('/current', async (req, res) => {
  try {
    await ensurePackages();
    let sub = await ClinicSubscription.findOne({ clinicId: 1, status: 'active' }).populate('packageId');
    if (!sub) {
      const profPkg = await Package.findOne({ name: 'Professional' }) || await Package.findOne();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      sub = await ClinicSubscription.create({
        clinicId: 1,
        packageId: profPkg._id,
        packageName: profPkg.name,
        priceMonthly: profPkg.priceMonthly,
        status: 'active',
        startDate: new Date(),
        endDate
      });
      sub = await ClinicSubscription.findById(sub._id).populate('packageId');
    }
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subscribe or Upgrade
router.post('/subscribe', async (req, res) => {
  try {
    const { packageId, isAnnual, promoCode } = req.body;
    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    // Cancel existing active
    await ClinicSubscription.updateMany({ clinicId: 1, status: 'active' }, { status: 'cancelled' });

    const endDate = new Date();
    if (isAnnual) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const newSub = await ClinicSubscription.create({
      clinicId: 1,
      packageId: pkg._id,
      packageName: pkg.name,
      priceMonthly: pkg.priceMonthly,
      status: 'active',
      startDate: new Date(),
      endDate
    });

    let baseAmount = Number(pkg.priceMonthly);
    if (isAnnual) baseAmount = baseAmount * 12 * 0.8;
    if (promoCode && promoCode.toUpperCase() === 'DENTAL10') baseAmount = baseAmount * 0.9;

    const invoice = await SubscriptionInvoice.create({
      clinicId: 1,
      subscriptionId: newSub._id,
      amount: Number(baseAmount.toFixed(2)),
      status: 'paid',
      dueDate: new Date(),
      paidDate: new Date()
    });

    res.json({ success: true, subscription: newSub, invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Downgrade
router.post('/downgrade', async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    await ClinicSubscription.updateMany({ clinicId: 1, status: 'active' }, { status: 'cancelled' });

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const newSub = await ClinicSubscription.create({
      clinicId: 1,
      packageId: pkg._id,
      packageName: pkg.name,
      priceMonthly: pkg.priceMonthly,
      status: 'active',
      startDate: new Date(),
      endDate
    });

    const invoice = await SubscriptionInvoice.create({
      clinicId: 1,
      subscriptionId: newSub._id,
      amount: pkg.priceMonthly,
      status: 'paid',
      dueDate: new Date(),
      paidDate: new Date()
    });

    res.json({ success: true, subscription: newSub, invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate promo
router.post('/validate-promo', (req, res) => {
  const { code } = req.body;
  if (!code || (code.toUpperCase() !== 'DENTAL10' && code.toUpperCase() !== 'WELCOME20')) {
    return res.status(400).json({ error: "Invalid promo code. Try 'DENTAL10'" });
  }
  res.json({ success: true, discountPercent: 10, message: "Promo code applied: 10% OFF!" });
});

// Get history
router.get('/history', async (req, res) => {
  try {
    const history = await ClinicSubscription.find({ clinicId: 1 }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get invoices
router.get('/invoices', async (req, res) => {
  try {
    const invs = await SubscriptionInvoice.find({ clinicId: 1 }).sort({ createdAt: -1 });
    res.json(invs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
