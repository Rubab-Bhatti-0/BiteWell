# AI Agents Feature

Drop-in folder for a Next.js (App Router) project implementing an animated
AI Agents management dashboard: enable/disable cards, limit/downgrade
modals, and a lazy-loaded analytics page with charts.

## Structure

```
ai-agents-feature/
├── app/
│   └── dashboard/ai-agents/analytics/page.tsx   # Analytics page (charts + logs)
├── components/
│   ├── ui/
│   │   └── AnimatedModal.tsx                    # Shared animated modal shell
│   └── ai-agents/
│       ├── AgentCard.tsx                        # Individual agent card
│       ├── AgentList.tsx                        # Grid + skeleton loading + empty state
│       ├── AgentLimitModal.tsx                  # "Upgrade plan" limit modal
│       ├── DowngradeModal.tsx                   # Downgrade confirmation modal
│       └── UsageLogsTable.tsx                   # Execution logs table (stub data)
├── hooks/
│   └── useAgents.ts                             # useAgents() + useAgentAnalytics() (stub data)
├── types/
│   └── agent.ts                                 # Agent & AgentAnalytics types
└── package.json
```

## Setup

1. Copy this folder's contents into the root of your existing Next.js app
   (merging `app/`, `components/`, `hooks/`, and `types/` into your project),
   or use it as a standalone starting point.
2. Install dependencies:
   ```bash
   npm install
   ```
   (or just `npm install framer-motion lucide-react sonner recharts` if
   merging into an existing project that already has Next/React/Tailwind.)
3. Make sure Tailwind CSS is configured in your project (this code relies on
   Tailwind utility classes and `dark:` variants).
4. Confirm your `tsconfig.json` has the `@/*` path alias set up, e.g.:
   ```json
   {
     "compilerOptions": {
       "paths": { "@/*": ["./*"] }
     }
   }
   ```

## Notes on stub files

Two files were referenced in the original snippets but not included in the
provided code, so minimal working placeholders were added:

- **`hooks/useAgents.ts`** — `useAgents()` and `useAgentAnalytics()` currently
  return mock data after a short simulated delay. Replace with real API/
  react-query/SWR calls.
- **`components/ai-agents/UsageLogsTable.tsx`** — renders a static mock log
  table. Replace `MOCK_LOGS` with real execution log data.

Everything else (`AnimatedModal`, `AgentCard`, `AgentList`, `AgentLimitModal`,
`DowngradeModal`, the analytics `page.tsx`) is exactly what was provided,
just organized into the folder paths implied by their import statements.
