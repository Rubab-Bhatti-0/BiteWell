"use client";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
const MOCK_LOGS = [
  { id: "1", agentName: "Scheduling Assistant", action: "Booked appointment", status: "success", timestamp: "2 min ago" },
  { id: "2", agentName: "Billing Assistant", action: "Flagged invoice #4821", status: "success", timestamp: "14 min ago" },
  { id: "3", agentName: "Intake Summarizer", action: "Generated summary", status: "failed", timestamp: "32 min ago" },
  { id: "4", agentName: "Scheduling Assistant", action: "Rescheduled appointment", status: "pending", timestamp: "1 hr ago" }
];
const STATUS_MAP = {
  success: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-200/80", label: "Success" },
  failed: { icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200/80", label: "Failed" },
  pending: { icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200/80", label: "Pending" }
};
const UsageLogsTable = () => {
  return <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white/90 shadow-md shadow-sky-500/5 backdrop-blur-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-sky-50/60 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-sky-100">
          <tr>
            <th className="px-6 py-4">Agent Name</th>
            <th className="px-6 py-4">Execution Action</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Time Elapsed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sky-50 font-medium">
          {MOCK_LOGS.map((log) => {
    const { icon: Icon, color, label } = STATUS_MAP[log.status];
    return <tr key={log.id} className="hover:bg-sky-50/40 transition-colors duration-150">
                <td className="px-6 py-4 font-bold text-slate-900">{log.agentName}</td>
                <td className="px-6 py-4 text-slate-600">{log.action}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${color}`}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">{log.timestamp}</td>
              </tr>;
  })}
        </tbody>
      </table>
    </div>;
};
export {
  UsageLogsTable
};
