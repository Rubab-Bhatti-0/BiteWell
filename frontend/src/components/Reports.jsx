import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileSpreadsheet, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Reports({ onAlert }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all'); // all, cleared, uncleared
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearch,
        status: statusTab,
        page: page.toString(),
        limit: limit.toString()
      });
      const res = await apiFetch(`/api/patients?${queryParams}`);
      if (!res.ok) throw new Error('Failed to load report data.');
      const data = await res.json();
      setPatients(data.data);
      setTotalPages(data.pages);
      setTotalCount(data.total);
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusTab, page, onAlert]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleExportCSV = async () => {
    if (totalCount === 0) {
      onAlert({ type: 'warning', message: 'No patient records available to export.' });
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearch,
        status: statusTab
      });
      
      const res = await apiFetch(`/api/patients/export?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch data for export.');
      const result = await res.json();
      const allPatients = result.data;

      // Build CSV file content
      const headers = ['Patient ID', 'Name', 'Phone', 'Email', 'Age', 'Gender', 'Blood Group', 'Billing Status', 'Allergies', 'Medical Conditions', 'Date Added'];
      const rows = allPatients.map(p => [
        p._id,
        p.name,
        p.phone,
        p.email || '',
        p.age ?? '',
        p.gender || '',
        p.bloodGroup || '',
        p.status,
        (p.allergies || []).join('; '),
        (p.medicalConditions || []).join('; '),
        new Date(p.createdAt).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map((value) => {
          const printableValue = value ?? '';
          return `"${String(printableValue).replace(/"/g, '""')}"`;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `DentalPay_Patients_Report_${statusTab}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onAlert({ type: 'success', message: 'CSV Report exported successfully!' });
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Audits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate, filter, and export patient ledger directories</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-[#0A567D] hover:bg-[#084767] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Report (CSV)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'cleared', label: 'Cleared Ledger' },
              { id: 'uncleared', label: 'Outstanding Balance' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusTab(tab.id); setPage(1); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-[#0A567D] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Quick filter by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
              />
            </div>
            <button
              onClick={fetchPatients}
              title="Refresh"
              className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 skeleton rounded-lg"></div>
            <div className="h-14 skeleton rounded-lg"></div>
            <div className="h-14 skeleton rounded-lg"></div>
            <div className="h-14 skeleton rounded-lg"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">No ledger entries found matching active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Billing Status</th>
                  <th className="py-3 px-4 text-right">Register Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                {patients.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 text-slate-750 dark:text-slate-200 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400 uppercase">
                      DP-#{p._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-normal">
                      {p.email || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.status === 'cleared' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                          Cleared
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-amber-50 text-amber-600 border border-amber-100 font-bold">
                          Uncleared
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount} registry listings
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
