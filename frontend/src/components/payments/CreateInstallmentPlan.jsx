// ============================================
// FILE: frontend/src/components/payments/CreateInstallmentPlan.jsx
// PURPOSE: Modal form to create a new installment plan - Dark Mode Ready
// ============================================

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar } from 'lucide-react';
import { paymentService } from '../../services/payment.service';

/**
 * CreateInstallmentPlan Component
 * @param {string} patientId - ID of the patient
 * @param {string} patientName - Name of the patient (for display)
 * @param {array} treatments - List of available treatments
 * @param {function} onSuccess - Called when plan is created
 * @param {function} onCancel - Called when user cancels
 * @param {function} onAlert - Called to show notifications
 */
const CreateInstallmentPlan = ({ 
  patientId, 
  patientName, 
  treatments, 
  onSuccess, 
  onCancel, 
  onAlert 
}) => {
  // STATE: Tracks if we're submitting
  const [loading, setLoading] = useState(false);
  
  // STATE: Form data (what user types)
  const [formData, setFormData] = useState({
    treatmentId: '',
    totalCost: '',
    downPayment: '0',
    installmentCount: '3',
    dueDay: '1'
  });

  // STATE: Calculated values (auto-update)
  const [calculated, setCalculated] = useState({ 
    remaining: 0, 
    perInstallment: 0 
  });

  // EFFECT: Recalculate whenever numbers change
  useEffect(() => {
    const total = parseFloat(formData.totalCost) || 0;
    const down = parseFloat(formData.downPayment) || 0;
    const count = parseInt(formData.installmentCount) || 1;
    
    const remaining = Math.max(0, total - down);
    const perInstallment = count > 0 ? remaining / count : 0;
    
    setCalculated({ remaining, perInstallment });
  }, [formData.totalCost, formData.downPayment, formData.installmentCount]);

  // HANDLE FORM SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const totalCost = parseFloat(formData.totalCost);
    if (!formData.treatmentId) {
      return onAlert({ type: 'danger', message: 'Please select a treatment' });
    }
    if (!totalCost || totalCost <= 0) {
      return onAlert({ type: 'danger', message: 'Please enter a valid total cost' });
    }
    if (calculated.remaining <= 0) {
      return onAlert({ type: 'danger', message: 'No remaining amount to finance. Increase total cost or reduce down payment.' });
    }

    try {
      setLoading(true);
      
      // Call the API
      const result = await paymentService.createInstallmentPlan({
        patientId,
        treatmentId: formData.treatmentId,
        totalCost,
        downPayment: parseFloat(formData.downPayment) || 0,
        installmentCount: parseInt(formData.installmentCount),
        dueDay: parseInt(formData.dueDay)
      });
      
      // Success!
      onAlert({ 
        type: 'success', 
        message: `✅ Plan created! ${formData.installmentCount} payments of Rs ${calculated.perInstallment.toFixed(2)} each` 
      });
      onSuccess(result.data);
      
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Full-screen overlay (modal backdrop)
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      
      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Create Installment Plan
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For: {patientName || 'Patient'}
            </p>
          </div>
          <button 
            onClick={onCancel} 
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Treatment Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Treatment <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.treatmentId}
              onChange={(e) => setFormData({ ...formData, treatmentId: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00A3E1] focus:outline-none transition-all text-slate-900 dark:text-white"
              required
            >
              <option value="">Select a treatment...</option>
              {treatments.filter(t => t.isActive !== false).map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} - Rs {t.defaultCost?.toFixed(2) || '0.00'}
                </option>
              ))}
            </select>
          </div>

          {/* Total Cost */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Total Cost (Rs) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="number"
                value={formData.totalCost}
                onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 p-3 text-sm focus:ring-2 focus:ring-[#00A3E1] focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Down Payment (Rs)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="number"
                value={formData.downPayment}
                onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 p-3 text-sm focus:ring-2 focus:ring-[#00A3E1] focus:outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
              <p className="text-lg font-bold text-[#0A567D] dark:text-[#00A3E1]">
                Rs {calculated.remaining.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Per Installment</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                Rs {calculated.perInstallment.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Installment Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Installments
              </label>
              <select
                value={formData.installmentCount}
                onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00A3E1] focus:outline-none transition-all text-slate-900 dark:text-white"
              >
                <option value="2">2 months</option>
                <option value="3">3 months</option>
                <option value="4">4 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Due Day
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <select
                  value={formData.dueDay}
                  onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 p-3 text-sm focus:ring-2 focus:ring-[#00A3E1] focus:outline-none transition-all appearance-none text-slate-900 dark:text-white"
                >
                  {[...Array(28)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}{i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : i + 1 === 3 ? 'rd' : 'th'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Preview */}
          {calculated.remaining > 0 && (
            <div className="bg-[#00A3E1]/5 dark:bg-[#00A3E1]/10 border border-[#00A3E1]/20 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Patient will pay <span className="font-bold">{formData.installmentCount}</span> installments of{' '}
                <span className="font-bold text-[#0A567D] dark:text-[#00A3E1]">
                  Rs {calculated.perInstallment.toFixed(2)}
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || calculated.remaining <= 0}
              className="px-4 py-2 bg-[#0A567D] hover:bg-[#084767] dark:bg-[#00A3E1] dark:hover:bg-[#00A3E1]/80 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInstallmentPlan;