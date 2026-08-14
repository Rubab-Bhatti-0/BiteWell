// ============================================
// FILE: backend/models/InstallmentPlan.model.js
// PURPOSE: Stores payment plans for patients
// ============================================

const mongoose = require('mongoose');

const InstallmentPlanSchema = new mongoose.Schema(
  {
    // Which patient is this for?
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    // Which treatment is being paid for?
    treatmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Treatment',
      required: true,
    },
    // Total cost of treatment
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    // How much paid upfront
    downPayment: {
      type: Number,
      default: 0,
      min: 0,
    },
    // How much is left to pay
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // How many installments
    installmentCount: {
      type: Number,
      required: true,
      min: 1,
    },
    // Status: active, completed, or overdue
    status: {
      type: String,
      enum: ['active', 'completed', 'overdue'],
      default: 'active',
    },
    // Which clinic does this belong to?
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Indexes for faster queries
InstallmentPlanSchema.index({ patientId: 1, status: 1 });
InstallmentPlanSchema.index({ clinicId: 1, status: 1 });

module.exports = mongoose.model('InstallmentPlan', InstallmentPlanSchema);