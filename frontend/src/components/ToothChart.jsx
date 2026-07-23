import React, { useState, useEffect } from 'react';
const SVG_PATH_TOOTH = "M12 2C10.3 2 9 3.3 9 5c0 .3.1.5.2.8C8.5 6.1 8 6.9 8 8c0 1.5 1 3.5 1.5 5.5.3 1.2.5 2.5.5 3.5 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1-.2-2.3-.5-3.5C18 11.5 19 9.5 19 8c0-1.1-.5-1.9-1.2-2.2.1-.3.2-.5.2-.8 0-1.7-1.3-3-3-3h-3zm-1 3c0-.6.4-1 1-1h1c.6 0 1 .4 1 1s-.4 1-1 1h-1c-.6 0-1-.4-1-1z";

export default function ToothChart({ patientId, initialChart = [], treatmentsCatalog = [], onSave, onAlert }) {
  const [chart, setChart] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [editForm, setEditForm] = useState({ condition: 'Healthy', treatmentId: '', notes: '' });
  const [saving, setSaving] = useState(false);

  // Initialize tooth chart 1-32 if empty
  useEffect(() => {
    const fullChart = Array.from({ length: 32 }, (_, i) => {
      const toothNumber = i + 1;
      const existing = initialChart.find(t => t.toothNumber === toothNumber);
      return existing || { toothNumber, condition: 'Healthy', treatmentId: '', notes: '' };
    });
    setChart(fullChart);
  }, [initialChart]);

  const handleToothClick = (tooth) => {
    setSelectedTooth(tooth.toothNumber);
    setEditForm({
      condition: tooth.condition || 'Healthy',
      treatmentId: tooth.treatmentId || '',
      notes: tooth.notes || ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTooth = () => {
    const updatedChart = chart.map(t => {
      if (t.toothNumber === selectedTooth) {
        return {
          ...t,
          condition: editForm.condition,
          treatmentId: editForm.treatmentId || null,
          notes: editForm.notes
        };
      }
      return t;
    });
    setChart(updatedChart);
    setSelectedTooth(null);
  };

  const handleSaveFullChart = async () => {
    setSaving(true);
    try {
      const payload = chart.map(t => ({
        toothNumber: t.toothNumber,
        condition: t.condition,
        treatmentId: t.treatmentId || null,
        notes: t.notes
      }));

      const res = await fetch(`/api/patients/${patientId}/tooth-chart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update tooth chart.');
      }

      const updatedPatient = await res.json();
      onSave(updatedPatient);
      onAlert({ type: 'success', message: 'Tooth chart saved successfully!' });
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const getToothColor = (condition) => {
    switch (condition) {
      case 'Healthy':
        return 'fill-slate-200 text-slate-400 border-slate-200';
      case 'Decayed': // Danger semantic
        return 'fill-rose-500 text-rose-600 border-rose-500 bg-rose-50';
      case 'Filled': // Success / treated
        return 'fill-emerald-500 text-emerald-600 border-emerald-500 bg-emerald-50';
      case 'Missing': // Muted info
        return 'fill-slate-400 text-slate-500 border-slate-400 bg-slate-100';
      case 'Crown': // Warning semantic
        return 'fill-amber-500 text-amber-600 border-amber-500 bg-amber-50';
      case 'Bridge': // General Info semantic
        return 'fill-blue-500 text-blue-600 border-blue-500 bg-blue-50';
      default:
        return 'fill-slate-200 text-slate-400 border-slate-200';
    }
  };

  const upperTeeth = chart.slice(0, 16);
  const lowerTeeth = chart.slice(16, 32);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Interactive Tooth Chart</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Click any tooth to log condition and associate treatment plans</p>
        </div>
        <button
          onClick={handleSaveFullChart}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0A567D] hover:bg-[#084767] disabled:bg-slate-300 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : 'Save Tooth Chart'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 self-center">Legend:</span>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300"></span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-600"></span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Decayed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-600"></span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Filled / Treated</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-600"></span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Crown</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-blue-600"></span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Bridge</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-500"></span>
          <span className="text-xs text-slate-600 dark:text-slate-400">Missing</span>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="flex flex-col gap-8 items-center py-6 overflow-x-auto">
        {/* Upper Jaw (1 - 16) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Upper Jaw</span>
          <div className="flex gap-2">
            {upperTeeth.map((tooth) => {
              const colorClasses = getToothColor(tooth.condition);
              const isSelected = selectedTooth === tooth.toothNumber;
              return (
                <button
                  key={tooth.toothNumber}
                  onClick={() => handleToothClick(tooth)}
                  className={`flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#00A3E1] border-transparent scale-105 shadow-md' : 'hover:shadow-sm'
                  } ${colorClasses.split(' ').slice(1).join(' ')}`}
                >
                  <svg className={`w-8 h-8 ${colorClasses.split(' ')[0]}`} viewBox="0 0 24 24">
                    <path d={SVG_PATH_TOOTH} />
                  </svg>
                  <span className="text-[10px] font-bold mt-1.5">{tooth.toothNumber}</span>
                  {tooth.condition !== 'Healthy' && (
                    <span className="text-[9px] font-medium scale-90 opacity-85 px-1 rounded bg-black/5 dark:bg-white/10 mt-0.5">
                      {tooth.condition}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-700 max-w-4xl"></div>

        {/* Lower Jaw (17 - 32) */}
        <div className="flex flex-col items-center">
          <div className="flex gap-2">
            {lowerTeeth.map((tooth) => {
              const colorClasses = getToothColor(tooth.condition);
              const isSelected = selectedTooth === tooth.toothNumber;
              return (
                <button
                  key={tooth.toothNumber}
                  onClick={() => handleToothClick(tooth)}
                  className={`flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#00A3E1] border-transparent scale-105 shadow-md' : 'hover:shadow-sm'
                  } ${colorClasses.split(' ').slice(1).join(' ')}`}
                >
                  <span className="text-[10px] font-bold mb-1.5">{tooth.toothNumber}</span>
                  <svg className={`w-8 h-8 ${colorClasses.split(' ')[0]}`} viewBox="0 0 24 24">
                    <path d={SVG_PATH_TOOTH} />
                  </svg>
                  {tooth.condition !== 'Healthy' && (
                    <span className="text-[9px] font-medium scale-90 opacity-85 px-1 rounded bg-black/5 dark:bg-white/10 mt-0.5">
                      {tooth.condition}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-3">Lower Jaw</span>
        </div>
      </div>

      {/* Pop-up Edit Drawer/Modal for selected tooth */}
      {selectedTooth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-alert-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 fill-[#0A567D]" viewBox="0 0 24 24">
                  <path d={SVG_PATH_TOOTH} />
                </svg>
                Diagnose Tooth #{selectedTooth}
              </h4>
              <button
                onClick={() => setSelectedTooth(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-medium cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Condition</label>
                <select
                  name="condition"
                  value={editForm.condition}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Decayed">Decayed (Urgent)</option>
                  <option value="Filled">Filled / Treated</option>
                  <option value="Crown">Crown</option>
                  <option value="Bridge">Bridge</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>

              {/* Linked Treatment */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Linked Treatment Plan</label>
                <select
                  name="treatmentId"
                  value={editForm.treatmentId}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                >
                  <option value="">-- No Treatment Linked --</option>
                  {treatmentsCatalog.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} (${t.defaultCost})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Clinical Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={editForm.notes}
                  onChange={handleFormChange}
                  placeholder="Describe decay severity, root canal details, or next steps..."
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1] resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setSelectedTooth(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTooth}
                className="px-4 py-2 bg-[#0A567D] hover:bg-[#084767] text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer"
              >
                Apply Diagnosis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
