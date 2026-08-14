// ============================================
// FILE: frontend/src/services/payment.service.js
// PURPOSE: All payment API calls
// ============================================

const API_BASE = '/api/payments';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  const clinicId = user?.clinicId?._id || user?.clinicId || '60c72b2f9b1d8b2bad000001';
  return {
    'Content-Type': 'application/json',
    'x-clinic-id': clinicId,
    ...(token ? { Authorization: 'Bearer ' + token } : {})
  };
};

export const paymentService = {
  // 1. Create installment plan
  createInstallmentPlan: async (data) => {
    const response = await fetch(`${API_BASE}/installment-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create plan');
    }
    return response.json();
  },

  // 2. Mark installment as paid
  markInstallmentPaid: async (installmentId, paymentMethod) => {
    const response = await fetch(`${API_BASE}/installment/${installmentId}/pay`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ paymentMethod })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark as paid');
    }
    return response.json();
  },

  // 3. Get patient payment summary
  getPatientPayments: async (patientId) => {
    const response = await fetch(`${API_BASE}/patient/${patientId}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get patient payments');
    }
    return response.json();
  },

  // 4. Get plan installments
  getPlanInstallments: async (planId) => {
    const response = await fetch(`${API_BASE}/plan/${planId}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get plan installments');
    }
    return response.json();
  },

  // 5. Get all clinic plans
  getClinicPlans: async (status = 'all', page = 1, limit = 10) => {
    const params = new URLSearchParams({ status, page: page.toString(), limit: limit.toString() });
    const response = await fetch(`${API_BASE}/plans?${params}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get clinic plans');
    }
    return response.json();
  },

  // 6. Get revenue data
  getRevenue: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetch(`${API_BASE}/revenue?${params}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get revenue data');
    }
    return response.json();
  },

  // ============================================
  // 7. GET ALL INSTALLMENTS (for RevenueDetailsModal)
  // ============================================
  getAllInstallments: async () => {
    const response = await fetch(`${API_BASE}/plans?limit=100`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get installments');
    }
    
    const data = await response.json();
    
    // Fetch installments for each plan
    const allInstallments = [];
    for (const plan of data.data.plans) {
      const installmentsRes = await fetch(`${API_BASE}/plan/${plan._id}`, {
        headers: getHeaders()
      });
      if (installmentsRes.ok) {
        const installmentsData = await installmentsRes.json();
        allInstallments.push(...installmentsData.data.installments.map(i => ({
          ...i,
          patientName: plan.patientId?.name || 'Unknown Patient',
          treatmentName: plan.treatmentId?.name || 'Unknown Treatment'
        })));
      }
    }
    
    return allInstallments;
  }
};