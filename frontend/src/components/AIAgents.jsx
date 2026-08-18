import { BrainCircuit, Sparkles, Activity, ClipboardList, MessageCircle, ShieldCheck } from 'lucide-react';

export default function AIAgents({ onAlert }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Agents</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Explore six smart assistants built to streamline patient care, communication, billing, and clinic operations.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: 'Patient Outreach',
            description: 'Generate personalized follow-ups, appointment reminders, and care messages.',
            icon: MessageCircle
          },
          {
            title: 'Treatment Recommendations',
            description: 'Suggest care plans, post-op instructions, and customized treatment notes.',
            icon: BrainCircuit
          },
          {
            title: 'Financial Assistant',
            description: 'Create invoices, payment reminders, and billing summaries automatically.',
            icon: ClipboardList
          },
          {
            title: 'Review Insights',
            description: 'Analyze patient feedback and surface clinic improvement opportunities.',
            icon: Sparkles
          },
          {
            title: 'Insurance Verifier',
            description: 'Check insurance eligibility, coverage details, and claim notes in one place.',
            icon: ShieldCheck
          },
          {
            title: 'Treatment Planner',
            description: 'Build multi-step care plans and patient education paths quickly.',
            icon: Activity
          }
        ].map((agent) => {
          const Icon = agent.icon;
          return (
            <div key={agent.title} className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-2xl bg-sky-50 dark:bg-slate-900 p-3 text-sky-600">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">AI Agent</span>
              </div>
              <div className="mt-6 space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{agent.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{agent.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onAlert?.({ type: 'success', message: `${agent.title} agent activated.` })}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A567D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#084767]"
              >
                Launch Agent
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
