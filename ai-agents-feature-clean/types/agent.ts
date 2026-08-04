export interface Agent {
  id: string;
  name: string;
  description: string;
  iconName: string; // one of: 'CalendarCheck' | 'Sparkles' | 'Receipt' | 'Bot' | 'FileText'
  isEnabled: boolean;
  category?: string;
}

export interface AgentAnalytics {
  totalRequestsToday: number;
  mostUsedAgent: string;
  activeAgentsCount: number;
  dailyRequests: { date: string; requests: number }[];
  usageByAgent: { name: string; requests: number }[];
}
