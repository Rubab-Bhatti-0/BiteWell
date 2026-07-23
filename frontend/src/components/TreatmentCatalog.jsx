import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function TreatmentCatalog({ onAlert }) {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null); // null if creating
  const [form, setForm] = useState({ name: '', defaultCost: '', category: 'General', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterActiveOnly ? '/api/treatments?isActive=true' : '/api/treatments';
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to load treatment catalog.');
      const data = await res.json();
      setTreatments(data);
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [filterActiveOnly, onAlert]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  const handleOpenCreate = () => {
    setEditingTreatment(null);
    setForm({ name: '', defaultCost: '', category: 'General', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTreatment(t);
    setForm({
      name: t.name,
      defaultCost: t.defaultCost,
      category: t.category,
      isActive: t.isActive
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.name.trim() === '') {
      onAlert({ type: 'danger', message: 'Treatment name is required.' });
      return;
    }
    if (isNaN(form.defaultCost) || Number(form.defaultCost) <= 0) {
      onAlert({ type: 'danger', message: 'Default cost must be a positive number.' });
      return;
    }

    setSubmitting(true);
    try {
      const method = editingTreatment ? 'PUT' : 'POST';
      const url = editingTreatment ? `/api/treatments/${editingTreatment._id}` : '/api/treatments';
      
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          defaultCost: Number(form.defaultCost),
          category: form.category,
          isActive: form.isActive
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save treatment.');
      }

      onAlert({
        type: 'success',
        message: `Treatment ${editingTreatment ? 'updated' : 'created'} successfully!`
      });
      setIsModalOpen(false);
      fetchTreatments();
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate (soft-delete) this treatment? It will remain in historic charts.')) return;
    try {
      const res = await apiFetch(`/api/treatments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to deactivate treatment.');
      }
      onAlert({ type: 'success', message: 'Treatment deactivated successfully.' });
      fetchTreatments();
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Treatment Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Predefined pricing list and services library</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#0A567D] hover:bg-[#084767] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Treatment
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterActiveOnly(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                filterActiveOnly
                  ? 'bg-sky-50 border-[#00A3E1] text-[#0A567D]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {filterActiveOnly ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {filterActiveOnly ? 'Showing Active Only' : 'Showing All'}
            </button>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Total items: {treatments.length}
          </span>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 skeleton rounded-lg"></div>
            <div className="h-14 skeleton rounded-lg"></div>
            <div className="h-14 skeleton rounded-lg"></div>
            <div className="h-14 skeleton rounded-lg"></div>
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 dark:text-slate-500 mb-2">No treatments found in catalog.</p>
            <button
              onClick={handleOpenCreate}
              className="text-[#00A3E1] hover:underline text-sm font-semibold cursor-pointer"
            >
              Add a new catalog item now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Treatment Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Default Cost</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {treatments.map((t) => (
                  <tr
                    key={t._id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-xs text-slate-600 dark:text-slate-400 font-semibold border border-slate-200/50 dark:border-slate-700/50">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      ${t.defaultCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {t.isActive ? (
                        <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-2 justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          title="Edit"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {t.isActive && (
                          <button
                            onClick={() => handleDelete(t._id)}
                            title="Deactivate (Soft Delete)"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-950 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-alert-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Treatment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Tooth Whitening, Root Canal, Orthodontic Prep"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                >
                  <option value="General">General Dentistry</option>
                  <option value="Orthodontics">Orthodontics</option>
                  <option value="Endodontics">Endodontics (Root Canals)</option>
                  <option value="Periodontics">Periodontics (Gum Care)</option>
                  <option value="Cosmetics">Cosmetics</option>
                  <option value="Surgery">Oral Surgery</option>
                </select>
              </div>

              {/* Cost */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Default Cost ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="defaultCost"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 150.00"
                  value={form.defaultCost}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                />
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-slate-300 text-[#0A567D] focus:ring-[#00A3E1] cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  Mark as Active catalog offering
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0A567D] hover:bg-[#084767] text-white text-sm font-medium rounded-lg shadow-sm disabled:bg-slate-300 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
