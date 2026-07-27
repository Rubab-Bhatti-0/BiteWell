// ============================================
// FILE: frontend/src/components/payments/RevenueDetailsModal.jsx
// PURPOSE: Shows detailed revenue breakdown by patient
// ============================================

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { paymentService } from '../../services/payment.service';

const RevenueDetailsModal = ({ type, onClose, onAlert }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0 });

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // STEP 1: Get all plans
      const plansResponse = await paymentService.getClinicPlans('all', 1, 100);
      const plans = plansResponse.data?.plans || [];
      
      console.log('📋 Plans found:', plans.length);
      
      if (plans.length === 0) {
        setData([]);
        setSummary({ total: 0, count: 0 });
        setLoading(false);
        return;
      }
      
      // STEP 2: For each plan, get installments
      let allInstallments = [];
      
      for (const plan of plans) {
        try {
          console.log('🔍 Fetching installments for plan:', plan._id);
          const installmentsRes = await paymentService.getPlanInstallments(plan._id);
          const installments = installmentsRes.data?.installments || [];
          
          console.log(`✅ Found ${installments.length} installments for plan`);
          
          // Add patient and treatment info
          installments.forEach(inst => {
            allInstallments.push({
              ...inst,
              patientName: plan.patientId?.name || 'Unknown',
              treatmentName: plan.treatmentId?.name || 'Unknown'
            });
          });
        } catch (e) {
          console.error('Failed to fetch installments for plan:', plan._id, e);
        }
      }
      
      console.log('📊 Total installments found:', allInstallments.length);
      
      // STEP 3: Filter based on type
      let filteredData = [];
      switch(type) {
        case 'revenue':
          filteredData = allInstallments.filter(i => i.status === 'paid');
          break;
        case 'pending':
          filteredData = allInstallments.filter(i => i.status === 'pending');
          break;
        case 'overdue':
          filteredData = allInstallments.filter(i => i.status === 'overdue');
          break;
        case 'payments':
          filteredData = allInstallments.filter(i => i.status === 'paid');
          break;
        default:
          filteredData = allInstallments;
      }
      
      console.log(`🎯 Filtered (${type}):`, filteredData.length);
      
      // STEP 4: Calculate totals
      const total = filteredData.reduce((sum, i) => sum + (i.amount || 0), 0);
      
      setData(filteredData);
      setSummary({ total, count: filteredData.length });
      
    } catch (error) {
      console.error('❌ Error in fetchData:', error);
      onAlert?.({ type: 'danger', message: 'Failed to load data: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'revenue': return 'Total Revenue Breakdown';
      case 'pending': return 'Pending Payments';
      case 'overdue': return 'Overdue Payments';
      case 'payments': return 'All Payments Collected';
      default: return 'Payment Details';
    }
  };

  const getColor = () => {
    switch(type) {
      case 'revenue': return 'from-emerald-400 to-teal-600';
      case 'pending': return 'from-blue-500 to-indigo-600';
      case 'overdue': return 'from-rose-500 to-orange-600';
      case 'payments': return 'from-amber-500 to-orange-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A567D] mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${getColor()} p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{getTitle()}</h3>
              <p className="text-sm opacity-90">
                {summary.count} items · Total: Rs {summary.total.toFixed(2)}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-500 dark:text-slate-400">No {type} records found</p>
              <p className="text-sm text-slate-400 mt-1">
                {type === 'revenue' ? 'No payments have been collected yet.' :
                 type === 'pending' ? 'All installments are paid or up to date.' :
                 type === 'overdue' ? 'No overdue payments.' :
                 'No payments have been collected yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{item.patientName}</p>
                    <p className="text-xs text-slate-400">
                      {item.treatmentName || 'Unknown Treatment'}
                      {item.dueDate && ` · Due: ${new Date(item.dueDate).toLocaleDateString()}`}
                      {item.paidDate && ` · Paid: ${new Date(item.paidDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0A567D] dark:text-[#00A3E1]">
                      Rs {item.amount?.toFixed(2) || '0.00'}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0A567D] hover:bg-[#084767] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevenueDetailsModal;