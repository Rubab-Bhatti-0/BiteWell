import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, FileText, Edit, Trash2, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function PatientList({ onViewPatient, onAlert }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // all, cleared, uncleared
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 6; // Page limit

  // Add Patient Modal Form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', age: '', gender: 'male', bloodGroup: '', status: 'uncleared', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Patient modal states (triggered via Quick Action)
  const [editingPatient, setEditingPatient] = useState(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
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
      if (!res.ok) throw new Error('Failed to load patient records.');
      const data = await res.json();
      if (page > data.pages) {
        setPage(data.pages);
        return;
      }
      setPatients(data.data);
      setTotalPages(data.pages);
      setTotalCount(data.total);
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusTab, page, onAlert]);

  // Load patients list on query updates
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validations
    if (!form.name || form.name.trim() === '') {
      onAlert({ type: 'danger', message: 'Name is required.' });
      return;
    }
    if (!form.phone || form.phone.trim() === '') {
      onAlert({ type: 'danger', message: 'Phone number is required.' });
      return;
    }
    // Phone format validation (simple check)
    const phoneRegex = /^\+?[\d\s()-]{7,30}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      onAlert({ type: 'danger', message: 'Invalid phone number format. Please enter a valid number.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: form.age !== '' ? Number(form.age) : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create patient record.');
      }

      onAlert({ type: 'success', message: 'Patient registered successfully!' });
      setIsCreateOpen(false);
      // Reset form
      setForm({ name: '', phone: '', email: '', age: '', gender: 'male', bloodGroup: '', status: 'uncleared', notes: '' });
      fetchPatients();
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (p) => {
    setEditingPatient(p);
    setForm({
      name: p.name,
      phone: p.phone,
      email: p.email || '',
      age: p.age !== undefined ? p.age : '',
      gender: p.gender || 'male',
      bloodGroup: p.bloodGroup || '',
      status: p.status || 'uncleared',
      notes: p.notes || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      onAlert({ type: 'danger', message: 'Name and phone are required.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/patients/${editingPatient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: form.age !== '' ? Number(form.age) : null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update patient.');
      }

      onAlert({ type: 'success', message: 'Patient info updated successfully!' });
      setEditingPatient(null);
      // Reset form
      setForm({ name: '', phone: '', email: '', age: '', gender: 'male', bloodGroup: '', status: 'uncleared', notes: '' });
      fetchPatients();
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/patients/${deleteTarget._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete patient record.');
      }
      onAlert({ type: 'success', message: `Patient record for ${deleteTarget.name} deleted successfully.` });
      setDeleteTarget(null);
      fetchPatients();
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patients Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage patient demographics, tooth charts, and attachments</p>
        </div>
        <button
          onClick={() => { setEditingPatient(null); setIsCreateOpen(true); }}
          className="bg-[#0A567D] hover:bg-[#084767] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add New Patient
        </button>
      </div>

      {/* Grid containing filters, search and list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
        
        {/* Search and Filters Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit self-start">
            {[
              { id: 'all', label: 'All Patients' },
              { id: 'cleared', label: 'Cleared' },
              { id: 'uncleared', label: 'Uncleared' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusTab(tab.id); setPage(1); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-[#0A567D] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
            />
          </div>
        </div>

        {/* Content Table / Cards grid */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 skeleton rounded-lg"></div>
            <div className="h-16 skeleton rounded-lg"></div>
            <div className="h-16 skeleton rounded-lg"></div>
            <div className="h-16 skeleton rounded-lg"></div>
            <div className="h-16 skeleton rounded-lg"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-3">No patient records found matching query.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-[#00A3E1] hover:underline text-sm font-semibold cursor-pointer"
            >
              Register a new patient
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Age / Sex</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {patients.map((p) => (
                  <tr
                    key={p._id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-900 text-[#0A567D] font-bold flex items-center justify-center border border-slate-200">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => onViewPatient(p._id)}
                            className="block font-bold text-slate-900 dark:text-white hover:text-[#00A3E1] transition-colors cursor-pointer text-left"
                          >
                            {p.name}
                          </button>
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                            ID: #{p._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      {p.phone}
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-normal">
                      {p.email || '—'}
                    </td>
                    <td className="py-4 px-4 capitalize">
                      {p.age !== undefined ? `${p.age} yrs` : '—'} / <span className="text-slate-400">{p.gender}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {p.status === 'cleared' ? (
                        <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Cleared
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          Uncleared
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-2 justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewPatient(p._id)}
                          title="View Details & Tooth Chart"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditOpen(p)}
                          title="Edit"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Delete Patient"
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-950 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && totalCount > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount} patients
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE & EDIT modal form */}
      {(isCreateOpen || editingPatient) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-alert-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingPatient ? 'Edit Patient Record' : 'Register New Patient'}
              </h3>
              <button
                onClick={() => { setIsCreateOpen(false); setEditingPatient(null); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={editingPatient ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Patient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Johnathan Doe"
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="e.g. john@example.com"
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Age</label>
                  <input
                    type="number"
                    min="0"
                    name="age"
                    value={form.age}
                    onChange={handleInputChange}
                    placeholder="e.g. 34"
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                  <input
                    type="text"
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleInputChange}
                    placeholder="e.g. O+, AB-"
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Billing Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  >
                    <option value="uncleared">Uncleared</option>
                    <option value="cleared">Cleared</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Administrative Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={form.notes}
                  onChange={handleInputChange}
                  placeholder="Notes about patient conditions, billing limits, etc..."
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1] resize-none"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setEditingPatient(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0A567D] hover:bg-[#084767] text-white text-sm font-medium rounded-lg shadow-sm disabled:bg-slate-300 cursor-pointer"
                >
                  {submitting ? 'Registering...' : (editingPatient ? 'Save Changes' : 'Register Patient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-alert-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 border border-rose-100">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Patient Record?</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Are you sure you want to delete the clinical record for <strong className="text-slate-900 dark:text-white font-bold">{deleteTarget.name}</strong>?
                  <br />
                  This action is permanent and will delete all attachments and tooth chart histories.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg cursor-pointer"
                >
                  Cancel, Keep File
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
