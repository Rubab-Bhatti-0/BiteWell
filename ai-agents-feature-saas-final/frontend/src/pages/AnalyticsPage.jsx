import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Bot, Activity, Loader2, BarChart2 } from "lucide-react";
import { useAgentAnalytics } from "@/hooks/useAgents";
import { UsageLogsTable } from "@/components/ai-agents/UsageLogsTable";

// Lazy-loaded chart components (no SSR needed in a client-side SPA)
const ResponsiveContainer = lazy(() => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })));
const LineChart = lazy(() => import("recharts").then((mod) => ({ default: mod.LineChart })));
const Line = lazy(() => import("recharts").then((mod) => ({ default: mod.Line })));
const BarChart = lazy(() => import("recharts").then((mod) => ({ default: mod.BarChart })));
const Bar = lazy(() => import("recharts").then((mod) => ({ default: mod.Bar })));
const XAxis = lazy(() => import("recharts").then((mod) => ({ default: mod.XAxis })));
const YAxis = lazy(() => import("recharts").then((mod) => ({ default: mod.YAxis })));
const CartesianGrid = lazy(() => import("recharts").then((mod) => ({ default: mod.CartesianGrid })));
const Tooltip = lazy(() => import("recharts").then((mod) => ({ default: mod.Tooltip })));

function ChartsReady({ children }) {
  return <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-sky-500" />}>{children}</Suspense>;
}
function AnalyticsPage() {
  const { data: analytics, isLoading } = useAgentAnalytics();
  return <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-slate-50 to-blue-50/40 p-6 lg:p-10 space-y-8 relative overflow-hidden">
      <Toaster position="top-right" richColors />

      {
    /* Ambient background glow */
  }
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none animate-float-slow" />

      {
    /* Header */
  }
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
        <div>
          <Link
    href="/dashboard/ai-agents"
    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0284C7] hover:text-[#0A567D] transition mb-2 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 shadow-sm"
  >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to AI Agent Catalog
          </Link>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
            Agent Usage Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time execution metrics and activity breakdown across all operational assistants.
          </p>
        </div>
      </div>

      {
    /* Animated Metric Cards */
  }
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 relative z-10">
        <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-md shadow-sky-500/5 backdrop-blur-xl hover:border-sky-300 hover:shadow-sky-500/15 transition-all"
  >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Requests Today</p>
            <div className="p-2.5 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-100">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-sky-500" /> : analytics?.totalRequestsToday.toLocaleString()}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
            ↑ 12% from yesterday
          </span>
        </motion.div>

        <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-md shadow-sky-500/5 backdrop-blur-xl hover:border-sky-300 hover:shadow-sky-500/15 transition-all"
  >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Most Used Agent</p>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 truncate">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-sky-500" /> : analytics?.mostUsedAgent}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
            Highest conversion
          </span>
        </motion.div>

        <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-md shadow-sky-500/5 backdrop-blur-xl hover:border-sky-300 hover:shadow-sky-500/15 transition-all"
  >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active AI Agents</p>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-sky-500" /> : analytics?.activeAgentsCount}
          </p>
          <span className="mt-2 inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
            Active in your clinic
          </span>
        </motion.div>
      </div>

      {
    /* Lazy Loaded Charts */
  }
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 relative z-10">
        <div className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-md shadow-sky-500/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-[#0284C7]" />
              Daily AI Requests (Last 7 Days)
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
{isLoading ? <Loader2 className="h-8 w-8 animate-spin text-sky-500" /> : <ChartsReady><ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.dailyRequests}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderRadius: "14px", color: "#fff", border: "none" }} />
                  <Line type="monotone" dataKey="requests" stroke="#0284C7" strokeWidth={4} dot={{ r: 5, fill: "#0284C7", stroke: "#fff", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer></ChartsReady>}
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-md shadow-sky-500/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#0A567D]" />
              Usage Breakdown by Agent
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
{isLoading ? <Loader2 className="h-8 w-8 animate-spin text-sky-500" /> : <ChartsReady><ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.usageByAgent}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderRadius: "14px", color: "#fff", border: "none" }} />
                  <Bar dataKey="requests" fill="#0284C7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer></ChartsReady>}
          </div>
        </div>
      </div>

      {
    /* Execution Logs Table */
  }
      <section className="space-y-4 pt-2 relative z-10">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#0284C7]" />
          Real-time Agent Execution Logs
        </h3>
        <UsageLogsTable />
      </section>
    </div>;
}
export {
  AnalyticsPage as default
};
