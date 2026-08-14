import React, { useCallback, useEffect, useState } from 'react';
import { CalendarRange, Download, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';

function dateInput(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function SchedulingReportSection({ onAlert }) {
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return dateInput(date);
  });
  const [to, setTo] = useState(() => dateInput(new Date()));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const endExclusive = new Date(`${to}T00:00:00`);
      endExclusive.setDate(endExclusive.getDate() + 1);
      const params = new URLSearchParams({
        from: new Date(`${from}T00:00:00`).toISOString(),
        to: endExclusive.toISOString()
      });
      setReport(await apiFetch(`/api/scheduling/reports?${params}`));
    } catch (error) {
      onAlert({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [from, to, onAlert]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  function exportCsv() {
    if (!report) return;
    const appointmentRows = report.appointments.map((item) => [
      'Appointment',
      item.patientName,
      item.title,
      item.doctorName,
      item.status,
      new Date(item.startAt).toLocaleString()
    ]);
    const reminderRows = report.reminders.map((item) => [
      'Reminder',
      item.patientName,
      item.type,
      item.channel,
      item.status,
      new Date(item.scheduledFor).toLocaleString()
    ]);
    const rows = [
      ['Record Type', 'Patient', 'Detail', 'Doctor/Channel', 'Status', 'Date'],
      ...appointmentRows,
      ...reminderRows
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `DentalPay_Scheduling_${from}_${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onAlert({ type: 'success', message: 'Scheduling report exported.' });
  }

  const appointmentTotal = report
    ? report.appointmentSummary.reduce((sum, item) => sum + item.count, 0)
    : 0;
  const reminderTotal = report
    ? report.reminderSummary.reduce((sum, item) => sum + item.count, 0)
    : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <CalendarRange className="h-5 w-5 text-[#00A3E1]" /> Scheduling & Reminder Activity
          </h2>
          <p className="text-xs text-slate-400">Optional Person 3 report section</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label>
            <span className="form-label">From</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="form-control !w-auto" />
          </label>
          <label>
            <span className="form-label">To</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="form-control !w-auto" />
          </label>
          <button onClick={loadReport} className="rounded-xl border border-slate-200 p-2.5 text-[#0A567D]" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCsv} disabled={!report} className="inline-flex items-center gap-2 rounded-xl bg-[#0A567D] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-sky-50 p-4 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Appointments</p>
          <p className="mt-1 text-3xl font-extrabold text-[#0A567D] dark:text-[#00A3E1]">{appointmentTotal}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reminders</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-600">{reminderTotal}</p>
        </div>
      </div>
    </section>
  );
}
