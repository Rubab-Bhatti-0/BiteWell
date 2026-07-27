import React, { useCallback, useEffect, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  X,
  XCircle
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { toLocalDateTimeInput } from '../lib/date';

const typeLabels = {
  visit_upcoming: 'Upcoming visit',
  payment_due: 'Payment due',
  payment_overdue: 'Payment overdue',
  custom: 'Custom'
};

function statusClasses(status) {
  if (status === 'sent') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'failed') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-500 border-slate-200';
  if (status === 'sending') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function Reminders({ onAlert }) {
  const [reminders, setReminders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    channel: 'sms',
    scheduledFor: toLocalDateTimeInput(new Date()),
    message: ''
  });

  useEffect(() => {
    apiFetch('/api/patients?limit=500')
      .then((result) => setPatients(Array.isArray(result) ? result : result.data || []))
      .catch((error) => onAlert({ type: 'danger', message: error.message }));
  }, [onAlert]);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, channel, limit: '500' });
      const result = await apiFetch(`/api/reminders?${params}`);
      setReminders(result.data || []);
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [status, channel, onAlert]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  async function syncGenerated(selectedChannel) {
    setSyncing(true);
    try {
      const result = await apiFetch('/api/reminders/sync', {
        method: 'POST',
        body: JSON.stringify({ channel: selectedChannel, daysAhead: 7 })
      });
      await loadReminders();
      onAlert({
        type: 'success',
        message: `Sync complete: ${result.visits.created} visit and ${result.payments.created} payment reminders created.`
      });
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    } finally {
      setSyncing(false);
    }
  }

  async function createCustom(event) {
    event.preventDefault();
    try {
      await apiFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          scheduledFor: new Date(form.scheduledFor).toISOString()
        })
      });
      setModalOpen(false);
      await loadReminders();
      onAlert({ type: 'success', message: 'Custom reminder created.' });
    } catch (error) {
      onAlert({ type: error.status === 409 ? 'warning' : 'danger', message: error.message });
    }
  }

  async function sendNow(reminder) {
    try {
      await apiFetch(`/api/reminders/${reminder._id}/send`, { method: 'POST' });
      await loadReminders();
      onAlert({
        type: 'success',
        message: `Reminder sent${import.meta.env.DEV ? ' using the configured development mode' : ''}.`
      });
    } catch (error) {
      onAlert({ type: error.status === 409 ? 'warning' : 'danger', message: error.message });
    }
  }

  async function cancelReminder(reminder) {
    if (!window.confirm('Cancel this reminder?')) return;
    try {
      await apiFetch(`/api/reminders/${reminder._id}/cancel`, { method: 'PATCH' });
      await loadReminders();
      onAlert({ type: 'success', message: 'Reminder cancelled.' });
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    }
  }

  const counts = reminders.reduce((result, reminder) => {
    result[reminder.status] = (result[reminder.status] || 0) + 1;
    return result;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reminders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate, de-duplicate and send appointment or payment reminders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={syncing}
            onClick={() => syncGenerated('sms')}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-[#0A567D] disabled:opacity-50"
          >
            <Smartphone className="h-4 w-4" /> Sync SMS
          </button>
          <button
            disabled={syncing}
            onClick={() => syncGenerated('whatsapp')}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" /> Sync WhatsApp
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A567D] px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Custom Reminder
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Pending', counts.pending || 0, BellRing, 'text-amber-500'],
          ['Sent', counts.sent || 0, CheckCircle2, 'text-emerald-500'],
          ['Failed', counts.failed || 0, XCircle, 'text-rose-500']
        ].map(([label, count, Icon, color]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{count}</p>
            </div>
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-control !w-auto">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={channel} onChange={(event) => setChannel(event.target.value)} className="form-control !w-auto">
              <option value="all">All channels</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <button onClick={loadReminders} className="inline-flex items-center gap-2 text-xs font-bold text-[#0A567D]">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading reminders…</div>
        ) : reminders.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <BellRing className="mx-auto mb-2 h-9 w-9" />
            No reminders match these filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {reminders.map((reminder) => (
              <div key={reminder._id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">{reminder.patientName}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusClasses(reminder.status)}`}>
                        {reminder.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                        {reminder.channel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400">
                      {typeLabels[reminder.type]} · {new Date(reminder.scheduledFor).toLocaleString()} · {reminder.destination}
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {reminder.message}
                    </p>
                    {reminder.lastError && (
                      <p className="mt-2 text-xs font-semibold text-rose-600">{reminder.lastError}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {['pending', 'failed'].includes(reminder.status) && (
                      <button onClick={() => sendNow(reminder)} className="inline-flex items-center gap-1 rounded-lg bg-[#0A567D] px-3 py-2 text-xs font-bold text-white">
                        <Send className="h-3.5 w-3.5" /> Send now
                      </button>
                    )}
                    {!['sent', 'cancelled'].includes(reminder.status) && (
                      <button onClick={() => cancelReminder(reminder)} className="rounded-lg border border-rose-200 p-2 text-rose-500 hover:bg-rose-50" title="Cancel reminder">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-relaxed text-[#0A567D]">
        Development uses <strong>REMINDER_SEND_MODE=mock</strong>, so “Send now” tests the complete workflow without sending a real message. Set Twilio credentials only during final integration.
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={createCustom} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Custom Reminder</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <label>
                <span className="form-label">Patient *</span>
                <select required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })} className="form-control">
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>{patient.name} — {patient.phone}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="form-label">Channel *</span>
                  <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="form-control">
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </label>
                <label>
                  <span className="form-label">Schedule *</span>
                  <input type="datetime-local" required value={form.scheduledFor} onChange={(event) => setForm({ ...form, scheduledFor: event.target.value })} className="form-control" />
                </label>
              </div>
              <label>
                <span className="form-label">Message *</span>
                <textarea required rows="5" maxLength="1500" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="form-control" placeholder="Write a clear reminder…" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button className="rounded-xl bg-[#0A567D] px-5 py-2 text-sm font-bold text-white">Create Reminder</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
