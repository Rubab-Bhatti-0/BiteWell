import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import {
  addDays,
  initials,
  sameLocalDay,
  startOfCalendarGrid,
  toLocalDateTimeInput
} from '../lib/date';

const DEFAULT_DOCTOR_ID = '60c72b2f9b1d8b2bad000002';
const emptyForm = {
  patientId: '',
  doctorId: DEFAULT_DOCTOR_ID,
  doctorName: 'Dr. Sarah Chan',
  title: 'Dental consultation',
  treatmentName: '',
  startAt: '',
  endAt: '',
  status: 'scheduled',
  notes: ''
};

function appointmentColor(status) {
  if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'completed') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-600 border-rose-200 line-through';
  if (status === 'checked_in') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-sky-50 text-[#0A567D] border-sky-200';
}

export default function Appointments({ onAlert }) {
  const [month, setMonth] = useState(() => new Date());
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const gridStart = useMemo(() => startOfCalendarGrid(month), [month]);
  const calendarDays = useMemo(
    () => Array.from({ length: 42 }, (_, index) => addDays(gridStart, index)),
    [gridStart]
  );
  const gridEnd = useMemo(() => addDays(gridStart, 42), [gridStart]);

  useEffect(() => {
    apiFetch('/api/patients?limit=500')
      .then((result) => setPatients(Array.isArray(result) ? result : result.data || []))
      .catch((error) => onAlert({ type: 'danger', message: error.message }));
  }, [onAlert]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: gridStart.toISOString(),
        to: gridEnd.toISOString(),
        status,
        limit: '500'
      });
      const result = await apiFetch(`/api/appointments?${params}`);
      setAppointments(result.data || []);
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [gridStart, gridEnd, status, onAlert]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  function openCreate(date = new Date()) {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    setEditingId(null);
    setForm({
      ...emptyForm,
      startAt: toLocalDateTimeInput(start),
      endAt: toLocalDateTimeInput(end)
    });
    setModalOpen(true);
  }

  function openEdit(appointment) {
    setEditingId(appointment._id);
    setForm({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      title: appointment.title,
      treatmentName: appointment.treatmentName || '',
      startAt: toLocalDateTimeInput(appointment.startAt),
      endAt: toLocalDateTimeInput(appointment.endAt),
      status: appointment.status,
      notes: appointment.notes || ''
    });
    setModalOpen(true);
  }

  async function submitAppointment(event) {
    event.preventDefault();
    if (!form.patientId || !form.title || !form.startAt || !form.endAt) {
      onAlert({ type: 'warning', message: 'Patient, title, start and end time are required.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString()
      };
      await apiFetch(
        editingId ? `/api/appointments/${editingId}` : '/api/appointments',
        {
          method: editingId ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );
      setModalOpen(false);
      await loadAppointments();
      onAlert({
        type: 'success',
        message: editingId ? 'Appointment updated.' : 'Appointment booked successfully.'
      });
    } catch (error) {
      onAlert({ type: error.status === 409 ? 'warning' : 'danger', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(appointment) {
    if (!window.confirm(`Cancel ${appointment.patientName}'s appointment?`)) return;
    try {
      await apiFetch(`/api/appointments/${appointment._id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Cancelled from calendar' })
      });
      await loadAppointments();
      onAlert({ type: 'success', message: 'Appointment cancelled.' });
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    }
  }

  const visibleAppointments = appointments.filter((appointment) => {
    const query = search.trim().toLowerCase();
    return !query
      || appointment.patientName.toLowerCase().includes(query)
      || appointment.title.toLowerCase().includes(query)
      || appointment.doctorName.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Book visits and prevent doctor scheduling conflicts.
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A567D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#084767]"
        >
          <Plus className="h-4 w-4" /> Book Appointment
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="min-w-44 text-center font-bold text-slate-900 dark:text-white">
              {month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMonth(new Date())}
              className="rounded-lg px-3 py-2 text-xs font-bold text-[#0A567D] hover:bg-sky-50"
            >
              Today
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search calendar"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 sm:w-56"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked in</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayAppointments = visibleAppointments.filter((appointment) =>
                  sameLocalDay(appointment.startAt, day)
                );
                const outsideMonth = day.getMonth() !== month.getMonth();
                const today = sameLocalDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    onDoubleClick={() => openCreate(day)}
                    className="min-h-32 border-b border-r border-slate-100 p-2 dark:border-slate-700/70"
                  >
                    <button
                      onClick={() => openCreate(day)}
                      className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        today
                          ? 'bg-[#0A567D] text-white'
                          : outsideMonth
                            ? 'text-slate-300'
                            : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <button
                          key={appointment._id}
                          onClick={() => openEdit(appointment)}
                          className={`block w-full truncate rounded-md border px-2 py-1 text-left text-[10px] font-bold ${appointmentColor(appointment.status)}`}
                          title={`${appointment.patientName} — ${appointment.title}`}
                        >
                          {new Date(appointment.startAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          {appointment.patientName}
                        </button>
                      ))}
                      {dayAppointments.length > 3 && (
                        <span className="block px-1 text-[10px] font-semibold text-slate-400">
                          +{dayAppointments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {loading && <div className="p-4 text-center text-sm text-slate-400">Loading calendar…</div>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Month agenda</h2>
        {visibleAppointments.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            <CalendarDays className="mx-auto mb-2 h-8 w-8" />
            No appointments match this calendar.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {visibleAppointments.map((appointment) => (
              <div key={appointment._id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-[#0A567D]">
                    {initials(appointment.patientName)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{appointment.patientName}</p>
                    <p className="text-xs text-slate-400">
                      {appointment.title} · {appointment.doctorName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-[#00A3E1]" />
                    {new Date(appointment.startAt).toLocaleString()}
                  </span>
                  <button onClick={() => openEdit(appointment)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {!['cancelled', 'completed'].includes(appointment.status) && (
                    <button onClick={() => cancelAppointment(appointment)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitAppointment} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Appointment' : 'Book Appointment'}
                </h2>
                <p className="text-xs text-slate-400">Times are saved with timezone information.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="form-label">Patient *</span>
                <select
                  required
                  value={form.patientId}
                  onChange={(event) => setForm({ ...form, patientId: event.target.value })}
                  className="form-control"
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} — {patient.phone}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="form-label">Appointment title *</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="form-control" />
              </label>
              <label>
                <span className="form-label">Treatment</span>
                <input value={form.treatmentName} onChange={(event) => setForm({ ...form, treatmentName: event.target.value })} className="form-control" />
              </label>
              <label>
                <span className="form-label">Doctor name *</span>
                <input required value={form.doctorName} onChange={(event) => setForm({ ...form, doctorName: event.target.value })} className="form-control" />
              </label>
              <label>
                <span className="form-label">Doctor ID *</span>
                <input required value={form.doctorId} onChange={(event) => setForm({ ...form, doctorId: event.target.value })} className="form-control font-mono text-xs" />
              </label>
              <label>
                <span className="form-label">Start *</span>
                <input type="datetime-local" required value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} className="form-control" />
              </label>
              <label>
                <span className="form-label">End *</span>
                <input type="datetime-local" required value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} className="form-control" />
              </label>
              <label>
                <span className="form-label">Status</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="form-control">
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked in</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No show</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="form-label">Notes</span>
                <textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="form-control" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500">
                Cancel
              </button>
              <button disabled={saving} className="rounded-xl bg-[#0A567D] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
