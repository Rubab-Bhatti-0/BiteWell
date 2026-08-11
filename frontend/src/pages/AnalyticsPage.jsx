import { Toaster } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Bot, Activity, Loader2, BarChart2 } from "lucide-react";
import { useAgentAnalytics } from "@/hooks/useAgents";
import { UsageLogsTable } from "@/components/UsageLogsTable";

function AnalyticsPage({ onNavigate }) {
  const { data: analytics, isLoading } = useAgentAnalytics();

  // Compute chart dimensions for CSS-based bar chart
  const maxRequests = analytics?.dailyRequests?.length
    ? Math.max(...analytics.dailyRequests.map((d) => d.requests), 1)
    : 1;
  const maxAgentRequests = analytics?.usageByAgent?.length
    ? Math.max(...analytics.usageByAgent.map((u) => u.requests), 1)
    : 1;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-slate-50 to-blue-50/40 p-6 lg:p-10 space-y-8 relative overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* Ambient background glow */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none animate-float-slow" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
        <div>
          <button
            onClick={() => onNavigate?.('aiAgents')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0284C7] hover:text-[#0A567D] transition mb-2 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to AI Agent Catalog
          </button>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
            Agent Usage Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time execution metrics and activity breakdown across all operational assistants.
          </p>
        </div>
      </div>

      {/* Animated Metric Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 relative z-10">
        {/* Daily Requests Bar Chart */}
        <div className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-md shadow-sky-500/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-[#0284C7]" />
              Daily AI Requests (Last 7 Days)
            </h3>
          </div>
          <div className="h-72 w-full flex items-end justify-center gap-3 px-4">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            ) : (
              (analytics?.dailyRequests || []).map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-2 flex-1 group">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.requests}
                  </span>
                  <div
                    className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-[#0284C7] to-sky-300 group-hover:from-[#0A567D] group-hover:to-[#0284C7] transition-all duration-300 min-h-[8px]"
                    style={{ height: `${Math.max((d.requests / maxRequests) * 100, 3)}%` }}
                    title={`${d.date}: ${d.requests} requests`}
                  />
                  <span className="text-[11px] font-bold text-slate-500 truncate w-full text-center">{d.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Usage Breakdown by Agent */}
        <div className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-md shadow-sky-500/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#0A567D]" />
              Usage Breakdown by Agent
            </h3>
          </div>
          <div className="h-72 w-full flex flex-col justify-center gap-4 px-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : (
              (analytics?.usageByAgent || []).map((u) => (
                <div key={u.name} className="space-y-1.5 group">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 truncate">{u.name}</span>
                    <span className="text-xs font-black text-[#0284C7]">{u.requests}</span>
                  </div>
                  <div className="h-4 rounded-lg bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-[#0284C7] to-sky-300 group-hover:from-[#0A567D] group-hover:to-[#0284C7] transition-all duration-300"
                      style={{ width: `${Math.max((u.requests / maxAgentRequests) * 100, 5)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Execution Logs Table */}
      <section className="space-y-4 pt-2 relative z-10">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#0284C7]" />
          Real-time Agent Execution Logs
        </h3>
        <UsageLogsTable />
      </section>
    </div>
  );
}

export default AnalyticsPage;