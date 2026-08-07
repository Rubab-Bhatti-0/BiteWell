"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bot, CalendarCheck, Sparkles, Receipt, FileText, Loader2, CheckCircle2, Zap, ChevronRight } from "lucide-react";
import { AnimatedModal } from "@/components/ui/AnimatedModal";
const ICON_MAP = {
  CalendarCheck: <CalendarCheck className="h-7 w-7 text-[#0284C7]" />,
  Sparkles: <Sparkles className="h-7 w-7 text-amber-500" />,
  Receipt: <Receipt className="h-7 w-7 text-emerald-500" />,
  Bot: <Bot className="h-7 w-7 text-blue-600" />,
  FileText: <FileText className="h-7 w-7 text-sky-500" />
};
const AgentCard = ({
  agent,
  onEnable,
  onDisable,
  isPending = false
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const confirmEnable = () => {
    setShowConfirmModal(false);
    onEnable(agent);
  };
  const handleDisable = () => {
    onDisable(agent);
    toast.info(`${agent.name} has been disabled.`);
  };
  return <>
      <motion.div
    layout
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    whileHover={{ y: -8, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="group relative flex flex-col justify-between rounded-3xl border border-sky-100 bg-white/90 p-6 backdrop-blur-xl shadow-[0_10px_30px_-5px_rgba(2,132,199,0.08),_0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_22px_45px_-8px_rgba(2,132,199,0.22),_0_8px_20px_rgba(0,163,225,0.12)] hover:border-sky-300 transition-all duration-300 overflow-hidden"
  >
        {
    /* Subtle top glossy light line */
  }
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {
    /* Ambient background glow for active agent */
  }
        {agent.isEnabled && <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl pointer-events-none group-hover:bg-sky-300/50 transition-colors" />}

        <div>
          {
    /* Header Row: Icon & Status Badge */
  }
          <div className="flex items-start justify-between gap-3">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50/80 border border-sky-100 shadow-[0_6px_16px_rgba(2,132,199,0.12)] group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(2,132,199,0.22)] transition-all duration-300">
                {ICON_MAP[agent.iconName] || <Bot className="h-7 w-7 text-sky-600" />}
              </div>
              {agent.isEnabled && <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
                </span>}
            </div>

            <div className="flex flex-col items-end gap-1">
              {agent.isEnabled ? <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1 text-xs font-bold text-white shadow-md shadow-emerald-500/20">
                  <Zap className="h-3 w-3 fill-current animate-pulse" />
                  Active
                </span> : <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 border border-slate-200/80">
                  Inactive
                </span>}

              {agent.category && <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-[#0284C7] border border-sky-100">
                  {agent.category}
                </span>}
            </div>
          </div>

          {
    /* Title & Description */
  }
          <h3 className="mt-5 text-xl font-black text-slate-900 tracking-tight group-hover:text-[#0284C7] transition-colors">
            {agent.name}
          </h3>

          <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed font-normal">
            {agent.description}
          </p>
        </div>

        {
    /* Action Button Footer */
  }
        <div className="mt-6 pt-4 border-t border-sky-50">
          {agent.isEnabled ? <button
    onClick={handleDisable}
    disabled={isPending}
    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
  >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin text-rose-500" /> : null}
              {isPending ? "Disabling..." : "Disable Agent"}
            </button> : <button
    onClick={() => setShowConfirmModal(true)}
    disabled={isPending}
    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0284C7] via-[#0A567D] to-[#0284C7] hover:from-[#0369A1] hover:to-[#0284C7] py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
  >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4" />}
              {isPending ? "Enabling..." : "Enable Agent"}
              {!isPending && <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />}
            </button>}
        </div>
      </motion.div>

      {
    /* Confirmation Modal */
  }
      <AnimatedModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-50 text-[#0284C7] border border-sky-200 shadow-inner">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Enable {agent.name}?
            </h3>
            <p className="text-xs text-sky-600 font-medium">Activate AI capabilities</p>
          </div>
        </div>
        
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          This action will allocate <span className="font-bold text-slate-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">1 AI agent slot</span> from your active subscription plan.
        </p>

        <div className="mt-6 flex justify-end space-x-3">
          <button
    onClick={() => setShowConfirmModal(false)}
    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
  >
            Cancel
          </button>
          <button
    onClick={confirmEnable}
    className="rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0A567D] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/30 hover:shadow-sky-500/50 transition active:scale-[0.98]"
  >
            Enable Agent
          </button>
        </div>
      </AnimatedModal>
    </>;
};
export {
  AgentCard
};
