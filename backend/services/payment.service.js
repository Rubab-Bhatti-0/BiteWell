// ============================================
// FILE: backend/services/payment.service.js
// PURPOSE: Business logic for payments
// ============================================

const InstallmentPlan = require('../models/InstallmentPlan.model');
const Installment = require('../models/Installment.model');
const Patient = require('../models/Patient.model');
const Treatment = require('../models/Treatment.model');

class PaymentService {
  // CREATE: New installment plan
  async createInstallmentPlan(data, clinicId) {
    try {
      // Check if patient exists
      const patient = await Patient.findOne({ _id: data.patientId, clinicId });
      if (!patient) throw new Error('Patient not found or unauthorized');

      // Check if treatment exists
      const treatment = await Treatment.findOne({ _id: data.treatmentId, clinicId });
      if (!treatment) throw new Error('Treatment not found or unauthorized');

      // Calculate amounts
      const downPayment = data.downPayment || 0;
      const remainingAmount = data.totalCost - downPayment;

      if (remainingAmount < 0) {
        throw new Error('Down payment cannot exceed total cost');
      }
      if (remainingAmount === 0) {
        throw new Error('Total cost is fully covered. No installments needed.');
      }

      // Create the plan
      const plan = new InstallmentPlan({
        patientId: data.patientId,
        treatmentId: data.treatmentId,
        totalCost: data.totalCost,
        downPayment: downPayment,
        remainingAmount: remainingAmount,
        installmentCount: data.installmentCount,
        status: 'active',
        clinicId: clinicId,
      });
      await plan.save();

      // Generate individual installments
      const installments = [];
      const installmentAmount = remainingAmount / data.installmentCount;
      const dueDay = data.dueDay || 1;

      for (let i = 1; i <= data.installmentCount; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(dueDay);
        if (dueDate.getDate() !== dueDay) {
          dueDate.setDate(0);
        }

        const installment = new Installment({
          planId: plan._id,
          patientId: data.patientId,
          amount: installmentAmount,
          dueDate: dueDate,
          status: 'pending',
          clinicId: clinicId,
        });
        await installment.save();
        installments.push(installment);
      }

      return { plan, installments };
    } catch (error) {
      throw new Error(`Error creating installment plan: ${error.message}`);
    }
  }

  // ============================================
  // MARK: Installment as paid
  // UPDATED: Auto-sets patient to "cleared" when all installments are paid
  // ============================================
  async markInstallmentPaid(installmentId, paymentData, clinicId) {
    try {
      // Step 1: Find and update the installment
      const installment = await Installment.findOne({ _id: installmentId, clinicId });
      if (!installment) throw new Error('Installment not found or unauthorized');
      if (installment.status === 'paid') throw new Error('Installment already paid');

      installment.status = 'paid';
      installment.paidDate = new Date();
      installment.paymentMethod = paymentData.paymentMethod;
      await installment.save();

      // Step 2: Update the plan's remaining amount
      const plan = await InstallmentPlan.findOne({ _id: installment.planId, clinicId });
      if (!plan) throw new Error('Plan not found or unauthorized');

      plan.remainingAmount = Math.max(0, plan.remainingAmount - installment.amount);
      if (plan.remainingAmount <= 0) {
        plan.status = 'completed';
        plan.remainingAmount = 0;
      }
      await plan.save();

      // ============================================
      // 👇 NEW: AUTO-UPDATE PATIENT STATUS TO "CLEARED"
      // ============================================

      // Step 3: Check if ALL plans for this patient are completed
      const allPlans = await InstallmentPlan.find({
        patientId: plan.patientId,
        clinicId: clinicId
      });

      // If all plans are completed, update patient status to "cleared"
      const allCompleted = allPlans.every(p => p.status === 'completed');

      if (allCompleted) {
        await Patient.findOneAndUpdate(
          { _id: plan.patientId, clinicId: clinicId },
          { status: 'cleared' }
        );
        console.log(`✅ Patient ${plan.patientId} auto-updated to CLEARED`);
      }

      // ============================================
      // 👆 END OF NEW CODE
      // ============================================

      return { installment, plan };
    } catch (error) {
      throw new Error(`Error marking installment paid: ${error.message}`);
    }
  }

  // GET: Patient payment summary
  async getPatientPaymentSummary(patientId, clinicId) {
    try {
      const patient = await Patient.findOne({ _id: patientId, clinicId });
      if (!patient) throw new Error('Patient not found or unauthorized');

      const plans = await InstallmentPlan.find({ patientId, clinicId })
        .populate('treatmentId', 'name defaultCost')
        .sort({ createdAt: -1 });

      const installments = await Installment.find({ patientId, clinicId })
        .sort({ dueDate: -1 });

      const totalPaid = installments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

      const totalPending = installments
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + i.amount, 0);

      const totalOverdue = installments
        .filter(i => i.status === 'overdue')
        .reduce((sum, i) => sum + i.amount, 0);

      return {
        patientId,
        patientName: patient.name,
        summary: {
          totalPlans: plans.length,
          activePlans: plans.filter(p => p.status === 'active').length,
          completedPlans: plans.filter(p => p.status === 'completed').length,
          totalPaid,
          totalPending,
          totalOverdue,
          totalDue: totalPending + totalOverdue,
        },
        plans,
        installments,
      };
    } catch (error) {
      throw new Error(`Error getting payment summary: ${error.message}`);
    }
  }

  // GET: Revenue data for dashboard
  async getRevenueData(clinicId, startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const paidInstallments = await Installment.find({
        clinicId,
        paidDate: { $gte: start, $lte: end },
        status: 'paid',
      });

      const totalRevenue = paidInstallments.reduce((sum, i) => sum + i.amount, 0);

      const revenueByDay = {};
      paidInstallments.forEach(inst => {
        const date = inst.paidDate.toISOString().split('T')[0];
        if (!revenueByDay[date]) revenueByDay[date] = 0;
        revenueByDay[date] += inst.amount;
      });

      const pendingInstallments = await Installment.find({
        clinicId,
        status: { $in: ['pending', 'overdue'] },
      });
      const totalPending = pendingInstallments.reduce((sum, i) => sum + i.amount, 0);
      const overdueCount = await Installment.countDocuments({ clinicId, status: 'overdue' });

      return {
        totalRevenue,
        revenueByDay,
        totalPending,
        overdueCount,
        paidCount: paidInstallments.length,
      };
    } catch (error) {
      throw new Error(`Error getting revenue data: ${error.message}`);
    }
  }

  // GET: All clinic plans (with pagination)
  async getClinicPaymentPlans(clinicId, status, page = 1, limit = 10) {
    try {
      const filter = { clinicId };
      if (status && status !== 'all') {
        filter.status = status;
      }

      const skip = (page - 1) * limit;
      const plans = await InstallmentPlan.find(filter)
        .populate('patientId', 'name phone')
        .populate('treatmentId', 'name defaultCost')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await InstallmentPlan.countDocuments(filter);

      return { plans, total, page, pages: Math.ceil(total / limit) };
    } catch (error) {
      throw new Error(`Error getting clinic plans: ${error.message}`);
    }
  }

  // GET: Installments for a specific plan
  async getPlanInstallments(planId, clinicId) {
    try {
      const plan = await InstallmentPlan.findOne({ _id: planId, clinicId })
        .populate('treatmentId', 'name defaultCost')
        .populate('patientId', 'name phone');

      if (!plan) {
        throw new Error('Plan not found or unauthorized');
      }

      const installments = await Installment.find({ planId, clinicId })
        .sort({ dueDate: 1 });

      return { plan, installments };
    } catch (error) {
      throw new Error(`Error getting plan installments: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();