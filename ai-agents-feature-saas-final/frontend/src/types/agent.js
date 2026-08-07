/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} iconName - one of: 'CalendarCheck' | 'Sparkles' | 'Receipt' | 'Bot' | 'FileText'
 * @property {boolean} isEnabled
 * @property {string} [category]
 */

/**
 * @typedef {Object} AgentAnalytics
 * @property {number} totalRequestsToday
 * @property {string} mostUsedAgent
 * @property {number} activeAgentsCount
 * @property {{ date: string; requests: number }[]} dailyRequests
 * @property {{ name: string; requests: number }[]} usageByAgent
 */

export {};
