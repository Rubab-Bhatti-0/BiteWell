import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Users
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { initials, relativeTime } from '../lib/date';

function todayRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

export default function Dashboard({ onNavigate, onAlert }) {
  const [patientSummary, setPatientSummary] = useState({
    total: 0,
    cleared: 0,
    uncleared: 0
  });
  const [scheduling, setScheduling] = useState({
    upcomingVisits: [],
    recentActivity: [],
    pendingReminders: 0
  });
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const range = todayRange();
    const params = new URLSearchParams({
      from: range.from.toISOString(),
      to: range.to.toISOString()
    });
    const results = await Promise.allSettled([
      apiFetch('/api/patients/summary'),
      apiFetch(`/api/scheduling/dashboard?${params}`)
    ]);

    if (results[0].status === 'fulfilled') {
      setPatientSummary(results[0].value);
    } else {
      onAlert({ type: 'danger', message: results[0].reason.message });
    }
    if (results[1].status === 'fulfilled') {
      setScheduling(results[1].value);
    } else {
      onAlert({ type: 'danger', message: results[1].reason.message });
    }
    setLoading(false);
  }, [onAlert]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const cards = [
    {
      label: 'Total Patients',
      value: patientSummary.total,
      note: 'Active clinic registries',
      icon: Users,
      valueClass: 'text-slate-900 dark:text-white',
      iconClass: 'bg-sky-50 text-[#00A3E1]'
    },
    {
      label: 'Cleared Accounts',
      value: patientSummary.cleared,
      note: 'Zero outstanding balance',
      icon: CheckCircle2,
      valueClass: 'text-emerald-600',
      iconClass: 'bg-emerald-50 text-emerald-500'
    },
    {
      label: 'Uncleared Accounts',
      value: patientSummary.uncleared,
      note: 'Installments pending',
      icon: AlertCircle,
      valueClass: 'text-rose-500',
      iconClass: 'bg-rose-50 text-rose-500'
    },
    {
      label: 'Pending Reminders',
      value: scheduling.pendingReminders,
      note: 'Waiting to be sent',
      icon: Send,
      valueClass: 'text-[#0A567D] dark:text-[#00A3E1]',
      iconClass: 'bg-sky-50 text-[#0A567D]'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Practice Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live patient, visit and activity information.
          </p>
        </div>
        <button onClick={loadDashboard} className="text-xs font-bold text-[#0A567D] hover:underline">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, valueClass, iconClass }) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${valueClass}`}>
                {loading ? '…' : Number(value || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-400">{note}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Upcoming Visits Today</h2>
              <p className="text-xs text-slate-400">Real appointments from the clinic calendar</p>
            </div>
            <button onClick={() => onNavigate('appointments')} className="flex items-center gap-1 text-xs font-bold text-[#00A3E1]">
              View Calendar <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {scheduling.upcomingVisits.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-400 dark:bg-slate-900">
              <Calendar className="mx-auto mb-2 h-8 w-8" />
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {scheduling.upcomingVisits.map((visit) => (
                <div key={visit._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-[#0A567D]">
                      {initials(visit.patientName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{visit.patientName}</p>
                      <p className="truncate text-xs text-slate-400">{visit.title} · {visit.doctorName}</p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-[#00A3E1]" />
                    {new Date(visit.startAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <p className="text-xs text-slate-400">Tenant-scoped audit events</p>
          </div>
          {scheduling.recentActivity.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              <Activity className="mx-auto mb-2 h-8 w-8" />
              No activity recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {scheduling.recentActivity.slice(0, 6).map((item) => (
                <div key={item._id} className="flex gap-3">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-[#00A3E1]" />
                  <div>
                    <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">{item.description}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{relativeTime(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button onClick={() => onNavigate('patients')} className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sm font-bold text-[#0A567D]">
            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Patient</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => onNavigate('appointments')} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-bold text-emerald-700">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Book Appointment</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => onNavigate('reminders')} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm font-bold text-amber-700">
            <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Manage Reminders</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
