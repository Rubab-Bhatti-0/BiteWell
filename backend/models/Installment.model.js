// ============================================
// FILE: backend/models/Installment.model.js
// PURPOSE: Stores individual installment payments
// ============================================

const mongoose = require('mongoose');

const InstallmentSchema = new mongoose.Schema(
  {
    // Which plan does this belong to?
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstallmentPlan',
      required: true,
    },
    // Which patient is paying?
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    // Amount of this installment
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // When is it due?
    dueDate: {
      type: Date,
      required: true,
    },
    // When was it paid? (null if not paid)
    paidDate: {
      type: Date,
    },
    // Status: pending, paid, or overdue
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },
    // How was it paid?
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'jazzcash', 'easypaisa'],
    },
    // Which clinic does this belong to?
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
InstallmentSchema.index({ planId: 1 });
InstallmentSchema.index({ patientId: 1, status: 1 });
InstallmentSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Installment', InstallmentSchema);