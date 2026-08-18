import React, { useCallback, useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Trash2, Download, Paperclip, FileText, 
  Image as ImageIcon, CreditCard
} from 'lucide-react';
import ToothChart from './ToothChart';
import NextVisitCard from './NextVisitCard';

export default function PatientProfile({ patientId, onBack, onAlert }) {
  const [patient, setPatient] = useState(null);
  const [treatmentsCatalog, setTreatmentsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  const fetchPatientData = useCallback(async () => {
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
  }, [patientId, onAlert]);

  const fetchTreatmentsCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/treatments?isActive=true');
      if (!res.ok) throw new Error('Failed to load treatments catalog.');
      const data = await res.json();
      setTreatmentsCatalog(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPatientData();
    fetchTreatmentsCatalog();
  }, [fetchPatientData, fetchTreatmentsCatalog]);

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

    // Validate client-side
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
      e.target.value = ''; // Reset file input
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

  // Mocked details to complete UI mockup matching
  const mockInstallments = [
    { date: 'Oct 12, 2026', method: 'Visa **42', status: 'Success', amount: 1500.00 },
    { date: 'Sep 12, 2026', method: 'ACH Transfer', status: 'Success', amount: 1500.00 },
    { date: 'Aug 12, 2026', method: 'Cash', status: 'Success', amount: 1500.00 },
    { date: 'Jul 12, 2026', method: 'Visa **42', status: 'Failed', amount: 1500.00 }
  ];

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
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5 text-slate-500" /> Edit Demographics
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Patient Identity Card */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs relative overflow-hidden flex flex-col items-center">
            {/* Accent gradient banner */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#084767] to-[#00A3E1]"></div>
            
            {/* Profile Avatar */}
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-3xl mb-4 mt-2">
              {patient.name.charAt(0)}
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-0.5">{patient.name}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-4">Patient ID: DP-#{patient._id.slice(-6).toUpperCase()}</p>
            
            {/* Status Badge */}
            {patient.status === 'cleared' ? (
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 mb-6">
                Cleared
              </span>
            ) : (
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 mb-6 animate-pulse-slow">
                Uncleared
              </span>
            )}

            {/* Core Stats Details Grid */}
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

            {/* Contact Details */}
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

            {/* List of Attachments */}
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

          {/* Section: Mocked Payments and Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Installment History Panel (Group 1 Parity) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#00A3E1]" /> Installment History
                </h3>
                <button className="text-xs font-semibold text-[#00A3E1] hover:underline cursor-pointer">View All</button>
              </div>

              {/* Installments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 pb-2">Date</th>
                      <th className="py-2.5 pb-2">Method</th>
                      <th className="py-2.5 pb-2">Status</th>
                      <th className="py-2.5 pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {mockInstallments.map((inst, i) => (
                      <tr key={i} className="text-slate-700 dark:text-slate-300">
                        <td className="py-3 font-medium">{inst.date}</td>
                        <td className="py-3 font-semibold">{inst.method}</td>
                        <td className="py-3">
                          {inst.status === 'Success' ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-600 border border-rose-100 font-bold">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                          ${inst.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <NextVisitCard patientId={patientId} onAlert={onAlert} />

          </div>

        </div>

      </div>

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
                {/* Name */}
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

                {/* Phone */}
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

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A3E1]"
                  />
                </div>

                {/* Age */}
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

                {/* Gender */}
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

                {/* Blood Group */}
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

                {/* Status */}
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

              {/* Notes */}
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

              {/* Actions */}
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
