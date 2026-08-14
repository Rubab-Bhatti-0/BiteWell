// ============================================
// FILE: backend/controllers/Payment.controller.js
// PURPOSE: Handles HTTP requests for payments
// ============================================

const PaymentService = require('../services/payment.service');

// POST: Create installment plan
const createInstallmentPlan = async (req, res) => {
  try {
    const { patientId, treatmentId, totalCost, downPayment, installmentCount, dueDay } = req.body || {};
    const clinicId = req.user.clinicId;

    // Validation
    if (!patientId || !treatmentId) {
      return res.status(400).json({ error: 'Patient ID and Treatment ID are required.' });
    }
    if (!totalCost || totalCost <= 0) {
      return res.status(400).json({ error: 'Total cost must be greater than 0.' });
    }
    if (!installmentCount || installmentCount < 1) {
      return res.status(400).json({ error: 'Installment count must be at least 1.' });
    }

    const result = await PaymentService.createInstallmentPlan(
      {
        patientId,
        treatmentId,
        totalCost: Number(totalCost),
        downPayment: Number(downPayment || 0),
        installmentCount: Number(installmentCount),
        dueDay: Number(dueDay || 1),
      },
      clinicId
    );

    res.status(201).json({
      success: true,
      message: 'Installment plan created successfully.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT: Mark installment as paid
const markInstallmentPaid = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const { paymentMethod } = req.body || {};
    const clinicId = req.user.clinicId;

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required.' });
    }

    const result = await PaymentService.markInstallmentPaid(installmentId, { paymentMethod }, clinicId);

    res.status(200).json({
      success: true,
      message: 'Installment marked as paid successfully.',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET: Patient payment summary
const getPatientPayments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinicId;

    const result = await PaymentService.getPatientPaymentSummary(patientId, clinicId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET: Revenue data
const getRevenueData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const clinicId = req.user.clinicId;

    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const result = await PaymentService.getRevenueData(clinicId, start, end);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET: All clinic plans
const getClinicPlans = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const clinicId = req.user.clinicId;

    const result = await PaymentService.getClinicPaymentPlans(clinicId, status, Number(page), Number(limit));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// ============================================
// GET: Plan installments (ADD THIS)
// ============================================
const getPlanInstallments = async (req, res) => {
  try {
    const { planId } = req.params;
    const clinicId = req.user.clinicId;

    const result = await PaymentService.getPlanInstallments(planId, clinicId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Don't forget to EXPORT it!
module.exports = {
  createInstallmentPlan,
  markInstallmentPaid,
  getPatientPayments,
  getRevenueData,
  getClinicPlans,
  getPlanInstallments,
};