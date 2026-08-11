"use client";
import { AlertOctagon, Loader2 } from "lucide-react";
import { AnimatedModal } from "@/ui/AnimatedModal";
const DowngradeModal = ({
  isOpen,
  onClose,
  onConfirm,
  targetPlanName,
  allowedAgents,
  activeAgentsCount,
  isLoading = false
}) => {
  const agentsToDisable = Math.max(0, activeAgentsCount - allowedAgents);
  return <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col text-left">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-md shadow-amber-500/10">
          <AlertOctagon className="h-7 w-7" />
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Confirm Subscription Downgrade
        </h3>

        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <p className="font-medium text-slate-800">
            Downgrading to <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{targetPlanName}</span> supports only {allowedAgents} AI Agent{allowedAgents === 1 ? "" : "s"}.
          </p>
          <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200/80 text-amber-900 text-xs space-y-1.5 font-medium">
            <p className="font-bold">• {agentsToDisable} active agent{agentsToDisable > 1 ? "s" : ""} will be automatically deactivated.</p>
            <p>• Least recently triggered agents will be deactivated first.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse space-y-2 space-y-reverse sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
          <button
    onClick={onClose}
    disabled={isLoading}
    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
  >
            Cancel
          </button>
          <button
    onClick={onConfirm}
    disabled={isLoading}
    className="rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
  >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Processing..." : "Confirm Downgrade"}
          </button>
        </div>
      </div>
    </AnimatedModal>;
};
export {
  DowngradeModal
};
