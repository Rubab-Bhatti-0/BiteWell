// ============================================
// FILE: frontend/src/components/payments/PatientInstallmentHistory.jsx
// PURPOSE: Shows REAL payment history for a patient with Collect buttons - Dark Mode Ready
// ============================================

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { paymentService } from '../../services/payment.service';
import CollectPaymentModal from './CollectPaymentModal';

const PatientInstallmentHistory = ({ patientId, onAlert }) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchInstallments();
    }
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get patient summary to find all plans
      const summaryRes = await paymentService.getPatientPayments(patientId);
      const plans = summaryRes.data?.plans || [];
      
      if (plans.length === 0) {
        setInstallments([]);
        setLoading(false);
        return;
      }

      // Step 2: For each plan, fetch its installments
      let allInstallments = [];
      for (const plan of plans) {
        try {
          const planRes = await paymentService.getPlanInstallments(plan._id);
          const installmentsData = planRes.data?.installments || [];
          
          installmentsData.forEach(inst => {
            allInstallments.push({
              ...inst,
              treatmentName: plan.treatmentId?.name || 'Unknown Treatment'
            });
          });
        } catch (e) {
          console.error('Failed to fetch plan installments:', e);
        }
      }

      // Step 3: Sort by due date (most recent first)
      allInstallments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      
      setInstallments(allInstallments);
    } catch (error) {
      onAlert?.({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A567D] dark:border-[#00A3E1] mx-auto mb-3"></div>
        Loading payment history...
      </div>
    );
  }

  if (installments.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
        <CreditCard className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No payment history yet</p>
        <p className="text-sm text-slate-400 dark:text-slate-500">Create an installment plan to start tracking payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#00A3E1]" /> Payment History
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">{installments.length} payments</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Due Date</th>
              <th className="py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Treatment</th>
              <th className="py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
              <th className="py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {installments.map((inst) => (
              <tr key={inst._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="py-3 text-slate-600 dark:text-slate-300">
                  {new Date(inst.dueDate).toLocaleDateString()}
                </td>
                <td className="py-3 font-medium text-slate-800 dark:text-white">
                  {inst.treatmentName}
                </td>
                <td className="py-3 font-bold text-[#0A567D] dark:text-[#00A3E1]">
                  Rs {inst.amount?.toFixed(2) || '0.00'}
                </td>
                <td className="py-3">
                  {getStatusBadge(inst.status)}
                </td>
                <td className="py-3">
                  {inst.status !== 'paid' ? (
                    <button
                      onClick={() => setSelectedInstallment(inst)}
                      className="text-xs bg-[#0A567D] hover:bg-[#084767] dark:bg-[#00A3E1] dark:hover:bg-[#00A3E1]/80 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Collect
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">✓ Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Collect Payment Modal */}
      {selectedInstallment && (
        <CollectPaymentModal
          installment={selectedInstallment}
          onClose={() => setSelectedInstallment(null)}
          onSuccess={() => {
            setSelectedInstallment(null);
            fetchInstallments();
            onAlert?.({ type: 'success', message: '✅ Payment recorded successfully!' });
          }}
          onAlert={onAlert}
        />
      )}
    </div>
  );
};

export default PatientInstallmentHistory;