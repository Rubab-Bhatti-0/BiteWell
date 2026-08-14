import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Plus, Trash2, Download, Paperclip, FileText, 
  Image as ImageIcon, Calendar, CreditCard, ChevronRight, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import ToothChart from './ToothChart';

// 👇 NEW: Import payment components
import CreateInstallmentPlan from './payments/CreateInstallmentPlan';
import PatientInstallmentHistory from './payments/PatientInstallmentHistory';

export default function PatientProfile({ patientId, onBack, onAlert }) {
  const [patient, setPatient] = useState(null);
  const [treatmentsCatalog, setTreatmentsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 👇 NEW: Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [treatments, setTreatments] = useState([]);
  
  // Edit basic info modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', phone: '', email: '', age: '', gender: 'male', bloodGroup: '', status: 'uncleared', notes: ''
  });

  // Allergy / Medical Condition tag input states
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  // File upload state
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPatientData();
    fetchTreatmentsCatalog();
  }, [patientId]);

  // 👇 NEW: Fetch treatments when payment modal opens
  useEffect(() => {
    if (showPaymentModal) {
      fetchTreatments();
    }
  }, [showPaymentModal]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error('Failed to fetch patient details.');
      const data = await res.json();
      setPatient(data);
      setEditForm({
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        age: data.age !== undefined ? data.age : '',
        gender: data.gender || 'male',
        bloodGroup: data.bloodGroup || '',
        status: data.status || 'uncleared',
        notes: data.notes || ''
      });
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatmentsCatalog = async () => {
    try {
      const res = await fetch('/api/treatments?isActive=true');
      if (!res.ok) throw new Error('Failed to load treatments catalog.');
      const data = await res.json();
      setTreatmentsCatalog(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 👇 NEW: Fetch treatments for payment modal
  const fetchTreatments = async () => {
    try {
      const res = await fetch('/api/treatments', {
        headers: { 'x-clinic-id': '60c72b2f9b1d8b2bad000001' }
      });
      if (res.ok) {
        const data = await res.json();
        setTreatments(data);
      }
    } catch (error) {
      console.error('Failed to fetch treatments:', error);
    }
  };

  // Handle Basic Details Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.phone) {
      onAlert({ type: 'danger', message: 'Name and phone number are required.' });
      return;
    }

    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          age: editForm.age !== '' ? Number(editForm.age) : null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update patient info.');
      }

      const updated = await res.json();
      setPatient(updated);
      setIsEditModalOpen(false);
      onAlert({ type: 'success', message: 'Demographics updated successfully!' });
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    }
  };

  // Allergies & Conditions Tag management
  const addAllergy = async (e) => {
    if (e.key === 'Enter' && allergyInput.trim() !== '') {
      const newAllergies = [...patient.allergies, allergyInput.trim()];
      await updateMedicalTags(newAllergies, patient.medicalConditions);
      setAllergyInput('');
    }
  };

  const removeAllergy = async (index) => {
    const newAllergies = patient.allergies.filter((_, i) => i !== index);
    await updateMedicalTags(newAllergies, patient.medicalConditions);
  };

  const addCondition = async (e) => {
    if (e.key === 'Enter' && conditionInput.trim() !== '') {
      const newConditions = [...patient.medicalConditions, conditionInput.trim()];
      await updateMedicalTags(patient.allergies, newConditions);
      setConditionInput('');
    }
  };

  const removeCondition = async (index) => {
    const newConditions = patient.medicalConditions.filter((_, i) => i !== index);
    await updateMedicalTags(patient.allergies, newConditions);
  };

  const updateMedicalTags = async (allergies, medicalConditions) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medical-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergies, medicalConditions })
      });

      if (!res.ok) throw new Error('Failed to update medical information.');
      const updated = await res.json();
      setPatient(updated);
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    }
  };

  // Attachments Handling
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onAlert({ type: 'danger', message: 'File size exceeds 5MB limit.' });
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      onAlert({ type: 'danger', message: 'Only images and PDFs are allowed.' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const res = await fetch(`/api/patients/${patientId}/attachments`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload attachment.');
      }

      const updated = await res.json();
      setPatient(updated);
      onAlert({ type: 'success', message: 'Attachment uploaded successfully!' });
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete this attachment permanently?')) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete attachment.');
      const updated = await res.json();
      setPatient(updated);
      onAlert({ type: 'success', message: 'Attachment deleted.' });
    } catch (err) {
      onAlert({ type: 'danger', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 skeleton rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 skeleton rounded-2xl md:col-span-1"></div>
          <div className="h-96 skeleton rounded-2xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-[#0A567D] font-medium text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </button>
        <div className="flex gap-2">
          {/* 👇 NEW: Create Payment Plan Button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-[#0A567D] hover:bg-[#084767] text-white px-3.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Payment Plan
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Demographics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Patient Identity Card */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#084767] to-[#00A3E1]"></div>
            
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-3xl mb-4 mt-2">
              {patient.name.charAt(0)}
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-0.5">{patient.name}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-4">Patient ID: DP-#{patient._id.slice(-6).toUpperCase()}</p>
            
            {patient.status === 'cleared' ? (
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 mb-6">
                Cleared
              </span>
            ) : (
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 mb-6 animate-pulse-slow">
                Uncleared
              </span>
            )}

            <div className="grid grid-cols-3 w-full border-y border-slate-100 dark:border-slate-700 py-4 mb-6 text-center">
              <div className="border-r border-slate-100 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Age</span>
                <span className="text-md font-bold text-slate-800 dark:text-slate-200">{patient.age || '—'}</span>
              </div>
              <div className="border-r border-slate-100 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Blood</span>
                <span className="text-md font-bold text-slate-800 dark:text-slate-200">{patient.bloodGroup || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Gender</span>
                <span className="text-md font-bold text-slate-800 dark:text-slate-200 capitalize">{patient.gender || '—'}</span>
              </div>
            </div>

            <div className="w-full space-y-3.5 text-sm font-medium">
              <div className="flex gap-3 text-slate-600 dark:text-slate-400">
                <span className="text-xs text-slate-400 font-semibold w-14">Email:</span>
                <span className="text-slate-800 dark:text-slate-200 break-all">{patient.email || '—'}</span>
              </div>
              <div className="flex gap-3 text-slate-600 dark:text-slate-400">
                <span className="text-xs text-slate-400 font-semibold w-14">Phone:</span>
                <span className="text-slate-800 dark:text-slate-200">{patient.phone}</span>
              </div>
              {patient.notes && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Clinic Notes</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    {patient.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Info Tag Box */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Allergies</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {patient.allergies.length === 0 ? (
                  <span className="text-xs text-slate-400">No allergies listed.</span>
                ) : (
                  patient.allergies.map((alg, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                      {alg}
                      <button onClick={() => removeAllergy(i)} className="hover:text-rose-800 font-bold ml-0.5 cursor-pointer">&times;</button>
                    </span>
                  ))
                )}
              </div>
              <input
                type="text"
                placeholder="Type allergy & hit Enter..."
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={addAllergy}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A3E1]"
              />
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Medical Conditions</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {patient.medicalConditions.length === 0 ? (
                  <span className="text-xs text-slate-400">No conditions listed.</span>
                ) : (
                  patient.medicalConditions.map((cond, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                      {cond}
                      <button onClick={() => removeCondition(i)} className="hover:text-amber-800 font-bold ml-0.5 cursor-pointer">&times;</button>
                    </span>
                  ))
                )}
              </div>
              <input
                type="text"
                placeholder="Type condition & hit Enter..."
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={addCondition}
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A3E1]"
              />
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN & RIGHT COLUMN SPREAD */}
        <div className="xl:col-span-2 space-y-6">

          {/* Section: Tooth Chart */}
          <ToothChart 
            patientId={patientId} 
            initialChart={patient.toothChart} 
            treatmentsCatalog={treatmentsCatalog}
            onSave={(updated) => setPatient(updated)}
            onAlert={onAlert}
          />

          {/* Section: Attachments Upload Portal */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Patient Attachments</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Upload and manage X-Rays, medical reports, or consent sheets (Max 5MB)</p>
              </div>
              <label className="bg-[#0A567D] hover:bg-[#084767] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer">
                <Paperclip className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload File'}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {patient.attachments.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-400 dark:text-slate-500">
                <Paperclip className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No attachments uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.attachments.map((att) => {
                  const isImage = att.type === 'image';
                  return (
                    <div 
                      key={att._id} 
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500">
                          {isImage ? <ImageIcon className="w-5 h-5 text-sky-500" /> : <FileText className="w-5 h-5 text-red-500" />}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {att.url.split('/').pop()}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                            {new Date(att.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3">
                        <a
                          href={`/${att.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-[#0A567D] hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="View / Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 👇 REPLACED: REAL Installment History with REAL Payment Data */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs">
            <PatientInstallmentHistory patientId={patientId} onAlert={onAlert} />
          </div>

          {/* Appointment Schedule Panel (Keep as is) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00A3E1]" /> Appointment Schedule
              </h3>
              <button className="text-xs font-semibold text-[#00A3E1] hover:underline cursor-pointer">+ Schedule</button>
            </div>

            <div className="space-y-4">
              {/* Keep your mock appointments here - this is someone else's feature */}
              <div className="text-center py-4 text-slate-400 text-sm">
                Appointments feature coming soon
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 👇 NEW: Create Installment Plan Modal */}
      {showPaymentModal && (
        <CreateInstallmentPlan
          patientId={patient._id}
          patientName={patient.name}
          treatments={treatments}
          onSuccess={() => {
            setShowPaymentModal(false);
            onAlert({ type: 'success', message: '✅ Installment plan created successfully!' });
            fetchPatientData(); // Refresh patient data
          }}
          onCancel={() => setShowPaymentModal(false)}
          onAlert={onAlert}
        />
      )}

      {/* Edit Patient Modal Form */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-alert-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Patient Demographics</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Patient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Age</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.age}
                    onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                  <input
                    type="text"
                    placeholder="e.g. O+, A-"
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  >
                    <option value="cleared">Cleared</option>
                    <option value="uncleared">Uncleared</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Administrative Notes</label>
                <textarea
                  rows="3"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Allergies, emergency contact details, billing arrangements..."
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1] resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A567D] hover:bg-[#084767] text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer"
                >
                  Save Demographics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}