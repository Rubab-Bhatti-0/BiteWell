"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { Agent } from '@/types/agent';
import { AgentCard } from './AgentCard';

interface AgentListProps {
  agents: Agent[];
  onEnable: (agent: Agent) => void;
  onDisable: (agent: Agent) => void;
  isLoading: boolean;
  activeMutationId?: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  onEnable,
  onDisable,
  isLoading,
  activeMutationId,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-72 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer-effect opacity-60" />
            <div className="flex items-center justify-between">
              <div className="h-14 w-14 rounded-2xl bg-sky-100/70 animate-pulse" />
              <div className="h-7 w-20 rounded-full bg-sky-100/70 animate-pulse" />
            </div>
            <div className="mt-6 h-6 w-3/4 rounded-lg bg-sky-100/70 animate-pulse" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100 animate-pulse" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
            <div className="mt-8 h-12 w-full rounded-2xl bg-sky-100/50 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-200 bg-white/80 p-14 text-center shadow-lg shadow-sky-500/5 backdrop-blur-md"
      >
        <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-50 flex items-center justify-center text-[#0284C7] shadow-inner border border-sky-200 animate-float">
          <Bot className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-lg font-black text-slate-900">No Matching AI Agents Found</h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
          No agents match the selected category. Try selecting another filter above to discover available operational assistants.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      layout
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      <AnimatePresence mode="popLayout">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEnable={onEnable}
            onDisable={onDisable}
            isPending={activeMutationId === agent.id}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
