// ============================================
// FILE: frontend/src/components/payments/PaymentDashboard.jsx
// PURPOSE: Dashboard financial cards with clickable details - Dark Mode Ready
// ============================================

import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import { paymentService } from '../../services/payment.service';
import RevenueDetailsModal from './RevenueDetailsModal';

const PaymentDashboard = ({ onAlert }) => {
  const [revenue, setRevenue] = useState({
    totalRevenue: 0,
    totalPending: 0,
    overdueCount: 0,
    paidCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState(null);

  useEffect(() => {
    fetchRevenue();
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getRevenue();
      setRevenue(response.data);
    } catch (error) {
      onAlert?.({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (type) => {
    setSelectedModal(type);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 animate-pulse h-24"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <div
          onClick={() => handleCardClick('revenue')}
          className="bg-gradient-to-r from-emerald-400 to-teal-600 text-white rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
        >
          <DollarSign className="w-8 h-8 opacity-50" />
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="text-2xl font-bold">Rs {revenue.totalRevenue.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">Click to see breakdown</p>
        </div>

        {/* Pending Card */}
        <div
          onClick={() => handleCardClick('pending')}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
        >
          <CreditCard className="w-8 h-8 opacity-50" />
          <p className="text-sm opacity-90">Pending</p>
          <p className="text-2xl font-bold">Rs {revenue.totalPending.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">Click to see details</p>
        </div>

        {/* Overdue Card */}
        <div
          onClick={() => handleCardClick('overdue')}
          className="bg-gradient-to-r from-rose-500 to-orange-600 text-white rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
        >
          <AlertTriangle className="w-8 h-8 opacity-50" />
          <p className="text-sm opacity-90">Overdue</p>
          <p className="text-2xl font-bold">{revenue.overdueCount}</p>
          <p className="text-xs opacity-75 mt-1">Click to see details</p>
        </div>

        {/* Payments Collected Card */}
        <div
          onClick={() => handleCardClick('payments')}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl"
        >
          <TrendingUp className="w-8 h-8 opacity-50" />
          <p className="text-sm opacity-90">Payments Collected</p>
          <p className="text-2xl font-bold">{revenue.paidCount}</p>
          <p className="text-xs opacity-75 mt-1">Click to see details</p>
        </div>
      </div>

      {/* Modal */}
      {selectedModal && (
        <RevenueDetailsModal
          type={selectedModal}
          onClose={() => setSelectedModal(null)}
          onAlert={onAlert}
        />
      )}
    </>
  );
};

export default PaymentDashboard;