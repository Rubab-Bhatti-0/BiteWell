// ============================================
// FILE: backend/routes/Payment.routes.js (UPDATED)
// ============================================

const express = require('express');
const router = express.Router();
const {
  createInstallmentPlan,
  markInstallmentPaid,
  getPatientPayments,
  getRevenueData,
  getClinicPlans,
  getPlanInstallments,      // 👈 ADD THIS
} = require('../controllers/Payment.controller');
const { authMiddleware } = require('../middleware/auth');

// Apply auth to all payment routes
router.use(authMiddleware);

// TEST ROUTE
router.get('/test', (req, res) => {
  res.json({
    message: '✅ Payment routes are working!',
    clinicId: req.user.clinicId,
    timestamp: new Date()
  });
});

// ============================================
// PAYMENT ROUTES
// ============================================

// POST: Create installment plan
router.post('/installment-plan', createInstallmentPlan);

// PUT: Mark installment as paid
router.put('/installment/:installmentId/pay', markInstallmentPaid);

// GET: Patient payment summary
router.get('/patient/:patientId', getPatientPayments);

// GET: Revenue data
router.get('/revenue', getRevenueData);

// GET: All clinic plans (LIST)
router.get('/plans', getClinicPlans);

// GET: Single plan with installments 👈 ADD THIS
router.get('/plan/:planId', getPlanInstallments);

module.exports = router;