"use client";

import React from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { AnimatedModal } from '@/components/ui/AnimatedModal';

interface AgentLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  maxAgents: number;
}

export const AgentLimitModal: React.FC<AgentLimitModalProps> = ({
  isOpen,
  onClose,
  planName,
  maxAgents,
}) => {
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1 rounded-full hover:bg-slate-100"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 border border-rose-200/80 shadow-md shadow-rose-500/10 animate-bounce">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Agent Quota Limit Reached
        </h3>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your current <span className="font-bold text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">{planName}</span> plan supports up to <span className="font-bold text-slate-900">{maxAgents} active AI agents</span>.
        </p>
        <p className="mt-1.5 text-xs text-slate-500 max-w-xs">
          Upgrade your practice plan to unlock unlimited concurrent operational assistants.
        </p>

        <div className="mt-6 flex w-full flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              window.location.href = '/dashboard/settings/billing';
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0284C7] via-[#0A567D] to-[#0284C7] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition active:scale-[0.98]"
          >
            Upgrade Plan <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
};
