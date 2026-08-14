// ============================================
// FILE: frontend/src/components/payments/PaymentSummary.jsx
// PURPOSE: Shows payment plans on patient profile with Dark Mode
// ============================================

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import { paymentService } from '../../services/payment.service';
import CollectPaymentModal from './CollectPaymentModal';

const PaymentSummary = ({ patientId, patientName, onAlert }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPatientPayments(patientId);
      setData(response.data);
    } catch (error) {
      onAlert?.({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading payment data...</div>;
  }

  if (!data || data.summary.totalPlans === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
        <CreditCard className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No payment plans yet</p>
        <p className="text-sm text-slate-400 dark:text-slate-500">Create a plan to start tracking payments</p>
      </div>
    );
  }

  const { summary, plans } = data;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Plans</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{summary.totalPlans}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Completed</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary.completedPlans}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-600 dark:text-amber-400">Active</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary.activePlans}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 text-center">
          <p className="text-xs text-rose-600 dark:text-rose-400">Total Due</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">Rs {summary.totalDue.toFixed(2)}</p>
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {plan.treatmentId?.name || 'Unknown Treatment'}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Rs {plan.totalCost.toFixed(2)} total · Rs {plan.downPayment.toFixed(2)} down
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    plan.status === 'completed' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                      : plan.status === 'overdue'
                      ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                  }`}>
                    {plan.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {plan.installmentCount} installments
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Remaining</p>
                <p className="text-lg font-bold text-[#0A567D] dark:text-[#00A3E1]">
                  Rs {plan.remainingAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#084767] to-[#00A3E1] transition-all duration-500"
                  style={{ 
                    width: `${((plan.totalCost - plan.remainingAmount) / plan.totalCost) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {((plan.totalCost - plan.remainingAmount) / plan.totalCost * 100).toFixed(0)}% paid
              </p>
            </div>

            {/* Installments under this plan */}
            {plan._id && (
              <PlanInstallments planId={plan._id} onAlert={onAlert} />
            )}
          </div>
        ))}
      </div>

      {/* Collect Payment Modal */}
      {selectedInstallment && (
        <CollectPaymentModal
          installment={selectedInstallment}
          onClose={() => setSelectedInstallment(null)}
          onSuccess={() => {
            setSelectedInstallment(null);
            fetchData();
            onAlert?.({ type: 'success', message: 'Payment recorded!' });
          }}
          onAlert={onAlert}
        />
      )}
    </div>
  );
};

// ============================================
// SUB-COMPONENT: Plan Installments
// ============================================
const PlanInstallments = ({ planId, onAlert }) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetchInstallments();
    }
  }, [expanded]);

  const fetchInstallments = async () => {
    try {
      const response = await paymentService.getPlanInstallments(planId);
      setInstallments(response.data.installments);
    } catch (error) {
      onAlert?.({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium text-[#00A3E1] hover:underline flex items-center gap-1 cursor-pointer"
      >
        <Eye className="w-3 h-3" />
        {expanded ? 'Hide' : 'View'} Installments
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Loading...</p>
          ) : installments.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">No installments found</p>
          ) : (
            installments.map((inst) => (
              <div key={inst._id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Rs {inst.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Due: {new Date(inst.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    inst.status === 'paid' 
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                      : inst.status === 'overdue'
                      ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                  }`}>
                    {inst.status.toUpperCase()}
                  </span>
                  {inst.status !== 'paid' && (
                    <CollectPaymentButton 
                      installment={inst} 
                      onCollect={() => {
                        fetchInstallments();
                      }}
                      onAlert={onAlert}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// SUB-COMPONENT: Collect Payment Button
// ============================================
const CollectPaymentButton = ({ installment, onCollect, onAlert }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs bg-[#0A567D] hover:bg-[#084767] dark:bg-[#00A3E1] dark:hover:bg-[#00A3E1]/80 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
      >
        Collect Payment
      </button>
      
      {showModal && (
        <CollectPaymentModal
          installment={installment}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onCollect();
            onAlert?.({ type: 'success', message: 'Payment recorded!' });
          }}
          onAlert={onAlert}
        />
      )}
    </>
  );
};

export default PaymentSummary;