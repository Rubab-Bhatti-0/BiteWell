// ============================================
// FILE: frontend/src/components/payments/CollectPaymentModal.jsx
// PURPOSE: Modal to collect payment - Dark Mode Ready
// ============================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { paymentService } from '../../services/payment.service';

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'jazzcash', label: 'JazzCash', icon: '📱' },
  { value: 'easypaisa', label: 'EasyPaisa', icon: '📱' },
];

const CollectPaymentModal = ({ installment, onClose, onSuccess, onAlert }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('cash');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await paymentService.markInstallmentPaid(installment._id, selectedMethod);
      onSuccess();
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Collect Payment</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Amount: <span className="font-bold text-[#0A567D] dark:text-[#00A3E1]">
                Rs {installment.amount.toFixed(2)}
              </span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setSelectedMethod(method.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    selectedMethod === method.value
                      ? 'border-[#0A567D] dark:border-[#00A3E1] bg-[#0A567D]/5 dark:bg-[#00A3E1]/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <span className="text-2xl block">{method.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Display */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Amount to Collect</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              Rs {installment.amount.toFixed(2)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0A567D] hover:bg-[#084767] dark:bg-[#00A3E1] dark:hover:bg-[#00A3E1]/80 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectPaymentModal;