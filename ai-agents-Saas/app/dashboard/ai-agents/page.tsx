"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, BarChart3, ShieldAlert, Sparkles, CheckCircle2, Zap, Layers, Activity } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { AgentList } from '@/components/ai-agents/AgentList';
import { AgentLimitModal } from '@/components/ai-agents/AgentLimitModal';
import { DowngradeModal } from '@/components/ai-agents/DowngradeModal';
import { Agent } from '@/types/agent';
import { toast } from 'sonner';

export default function AIAgentsPage() {
  const { agents, isLoading, enableAgent, disableAgent, refetch } = useAgents();
  const [activeMutationId, setActiveMutationId] = useState<string | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  // Filter & Stats
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const activeCount = agents.filter((a: Agent) => a.isEnabled).length;
  const planName = 'Standard';
  const maxAgents = 3;

  const categories = ['All', ...Array.from(new Set(agents.map((a: Agent) => a.category).filter(Boolean))) as string[]];

  const filteredAgents = agents.filter((a: Agent) => {
    if (selectedCategory === 'All') return true;
    return a.category === selectedCategory;
  });

  const handleEnable = async (agent: Agent) => {
    setActiveMutationId(agent.id);
    const success = await enableAgent(agent);
    if (!success && activeCount >= maxAgents) {
      setIsLimitModalOpen(true);
    }
    setActiveMutationId(null);
  };

  const handleDisable = async (agent: Agent) => {
    setActiveMutationId(agent.id);
    await disableAgent(agent);
    setActiveMutationId(null);
  };

  const handleConfirmDowngrade = async () => {
    setIsDowngrading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : '';
      const res = await fetch('http://localhost:5000/api/subscription/downgrade', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planName: 'Free',
          maxAgents: 1
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Downgraded to Free Plan. ${data.disabledAgents.length} extra agents disabled.`);
        refetch();
      } else {
        toast.error(data.message || 'Failed to downgrade subscription.');
      }
    } catch (err) {
      toast.error('Network error during downgrade.');
    } finally {
      setIsDowngrading(false);
      setIsDowngradeModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-slate-50 to-blue-50/40 p-6 md:p-10 relative overflow-hidden">
      {/* Background Animated Floating Blue Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none animate-float" />

      <div className="relative mx-auto max-w-7xl space-y-8 z-10">
        
        {/* Top Header Navigation & Title */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0284C7]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 border border-sky-200 text-[#0284C7]">
                <Bot className="h-3.5 w-3.5" />
              </span>
              Dental SaaS Operations
            </div>
            <h1 className="mt-1 text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              AI Agent Catalog
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-xl leading-relaxed">
              Automate and optimize your dental practice workflows with specialized AI assistants.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              href="/dashboard/ai-agents/analytics"
              className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-white/90 px-5 py-3 text-sm font-bold text-slate-700 shadow-md shadow-sky-500/5 hover:border-sky-300 hover:bg-sky-50/60 hover:text-[#0284C7] transition-all duration-200 active:scale-95"
            >
              <BarChart3 className="h-4 w-4 text-[#0284C7]" />
              View Analytics
            </Link>

            <button
              onClick={() => setIsDowngradeModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-amber-500/10 text-amber-800 border border-amber-300/60 px-5 py-3 text-sm font-bold hover:bg-amber-500/20 transition-all duration-200 active:scale-95 shadow-sm"
            >
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Simulate Downgrade
            </button>
          </motion.div>
        </div>

        {/* 3D Modern Subscription Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A567D] via-[#0284C7] to-[#2563EB] p-8 text-white shadow-[0_20px_40px_-10px_rgba(2,132,199,0.35)] border border-sky-400/30"
        >
          {/* Shimmer overlay effect */}
          <div className="absolute inset-0 shimmer-effect opacity-20 pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-sky-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                Active Subscription: <span className="text-white font-black">{planName}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {activeCount} of {maxAgents} AI Agent Slots Active
              </h2>
              <p className="text-sm text-sky-100/90 font-medium max-w-lg">
                Your current plan supports up to {maxAgents} active operational agents simultaneously.
              </p>
            </div>

            {/* Quick Stat Badges inside Banner */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md px-6 py-4 border border-white/25 shadow-inner">
                <span className="text-2xl font-black text-white">{Math.max(0, maxAgents - activeCount)}</span>
                <span className="text-xs font-bold text-sky-100">Slots Remaining</span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md px-6 py-4 border border-white/25 shadow-inner">
                <span className="text-2xl font-black text-emerald-300">{activeCount}</span>
                <span className="text-xs font-bold text-sky-100">Running Now</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Stat Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-5 border border-sky-100 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-[#0284C7] font-bold">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Catalog</p>
              <p className="text-xl font-extrabold text-slate-900">{agents.length} AI Agents</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-5 border border-sky-100 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 font-bold">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Status</p>
              <p className="text-xl font-extrabold text-slate-900">{activeCount} Enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-5 border border-sky-100 shadow-sm backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Automated Tasks</p>
              <p className="text-xl font-extrabold text-slate-900">2,480/day</p>
            </div>
          </div>
        </motion.div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl bg-white/70 border border-sky-100/80 backdrop-blur-md shadow-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`relative rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0A567D] text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-600 hover:text-[#0284C7] hover:bg-sky-50/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Agent Grid */}
        <AgentList
          agents={filteredAgents}
          onEnable={handleEnable}
          onDisable={handleDisable}
          isLoading={isLoading}
          activeMutationId={activeMutationId}
        />
      </div>

      {/* Quota Limit Modal */}
      <AgentLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        planName={planName}
        maxAgents={maxAgents}
      />

      {/* Downgrade Simulation Modal */}
      <DowngradeModal
        isOpen={isDowngradeModalOpen}
        onClose={() => setIsDowngradeModalOpen(false)}
        onConfirm={handleConfirmDowngrade}
        targetPlanName="Free"
        allowedAgents={1}
        activeAgentsCount={activeCount}
        isLoading={isDowngrading}
      />
    </div>
  );
}
