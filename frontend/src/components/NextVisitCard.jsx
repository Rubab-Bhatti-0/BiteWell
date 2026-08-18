import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function NextVisitCard({ patientId, onAlert }) {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/appointments/patient/${patientId}/next`)
      .then((result) => setAppointment(result.appointment))
      .catch((error) => onAlert({ type: 'danger', message: error.message }))
      .finally(() => setLoading(false));
  }, [patientId, onAlert]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
        <Calendar className="h-4 w-4 text-[#00A3E1]" /> Next Visit
      </h3>
      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
      ) : !appointment ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400 dark:bg-slate-900">
          No upcoming appointment has been booked.
        </p>
      ) : (
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[#0A567D] dark:text-[#00A3E1]">{appointment.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{appointment.doctorName}</p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-emerald-600">
              {appointment.status}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-[#00A3E1]" />
            {new Date(appointment.startAt).toLocaleString()} –{' '}
            {new Date(appointment.endAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      )}
    </div>
  );
}
