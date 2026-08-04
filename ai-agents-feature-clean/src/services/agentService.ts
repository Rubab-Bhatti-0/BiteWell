import mongoose from 'mongoose';
import { AI_AGENTS, AIAgent } from '../constants/agents';
import { ClinicAgent, IClinicAgent } from '../models/ClinicAgent';
import { Subscription } from '../models/Subscription';
import { AgentUsageLog } from '../models/AgentUsageLog';
import { AppError } from '../middleware/errorHandler';

export interface AgentWithStatus extends AIAgent {
  enabled: boolean;
  enabledAt?: Date;
  lastUsedAt?: Date;
}

export class AgentService {
  /**
   * Get all AI agents with 'enabled' status calculated for a given clinic.
   */
  async getAllAgents(clinicId: string): Promise<AgentWithStatus[]> {
    const enabledClinicAgents = await ClinicAgent.find({
      clinicId,
      status: 'enabled'
    }).lean();

    const enabledAgentMap = new Map<string, IClinicAgent>();
    enabledClinicAgents.forEach((ca) => {
      enabledAgentMap.set(ca.agentId, ca as unknown as IClinicAgent);
    });

    return AI_AGENTS.map((agent) => {
      const clinicAgent = enabledAgentMap.get(agent.id);
      return {
        ...agent,
        enabled: Boolean(clinicAgent),
        enabledAt: clinicAgent?.enabledAt,
        lastUsedAt: clinicAgent?.lastUsedAt
      };
    });
  }

  /**
   * Validate if an agentId exists in hardcoded AI_AGENTS catalog.
   */
  validateAgent(agentId: string): AIAgent | undefined {
    return AI_AGENTS.find((agent) => agent.id === agentId);
  }

  /**
   * Check if a clinic is allowed to enable another agent according to subscription maxAgents.
   */
  async canEnableAgent(clinicId: string, agentIdToEnable?: string): Promise<{ allowed: boolean; enabledAgentsCount: number; maxAgents: number }> {
    const subscription = await Subscription.findOne({ clinicId });
    if (!subscription || subscription.status !== 'active') {
      throw new AppError('Active subscription required to manage AI agents.', 400);
    }

    // Check if agent is already enabled for this clinic
    if (agentIdToEnable) {
      const existing = await ClinicAgent.findOne({ clinicId, agentId: agentIdToEnable, status: 'enabled' });
      if (existing) {
        // Already enabled, enabling again does not increment total count
        return { allowed: true, enabledAgentsCount: await ClinicAgent.countDocuments({ clinicId, status: 'enabled' }), maxAgents: subscription.maxAgents };
      }
    }

    const enabledAgentsCount = await ClinicAgent.countDocuments({
      clinicId,
      status: 'enabled'
    });

    const allowed = enabledAgentsCount < subscription.maxAgents;
    return {
      allowed,
      enabledAgentsCount,
      maxAgents: subscription.maxAgents
    };
  }

  /**
   * Fetch complete agent details for all enabled agents of a clinic.
   */
  async getEnabledAgents(clinicId: string): Promise<AgentWithStatus[]> {
    const enabledRecords = await ClinicAgent.find({
      clinicId,
      status: 'enabled'
    }).lean();

    const enabledAgentMap = new Map<string, IClinicAgent>();
    enabledRecords.forEach((rec) => enabledAgentMap.set(rec.agentId, rec as unknown as IClinicAgent));

    const result: AgentWithStatus[] = [];
    for (const agent of AI_AGENTS) {
      const record = enabledAgentMap.get(agent.id);
      if (record) {
        result.push({
          ...agent,
          enabled: true,
          enabledAt: record.enabledAt,
          lastUsedAt: record.lastUsedAt
        });
      }
    }

    return result;
  }

  /**
   * Enable an agent for a clinic after validating existence and subscription quota.
   */
  async enableAgent(clinicId: string, agentId: string) {
    const agent = this.validateAgent(agentId);
    if (!agent) {
      throw new AppError('Invalid AI Agent', 400);
    }

    const check = await this.canEnableAgent(clinicId, agentId);
    if (!check.allowed) {
      return {
        success: false as const,
        message: 'Maximum AI agents reached. Upgrade your subscription.',
        maxAgents: check.maxAgents,
        enabledAgentsCount: check.enabledAgentsCount
      };
    }

    const updatedClinicAgent = await ClinicAgent.findOneAndUpdate(
      { clinicId, agentId },
      {
        status: 'enabled',
        enabledAt: new Date()
      },
      { upsert: true, new: true }
    );

    return {
      success: true as const,
      data: {
        ...agent,
        status: updatedClinicAgent.status,
        enabledAt: updatedClinicAgent.enabledAt,
        lastUsedAt: updatedClinicAgent.lastUsedAt
      }
    };
  }

  /**
   * Disable an agent for a clinic.
   */
  async disableAgent(clinicId: string, agentId: string) {
    const agent = this.validateAgent(agentId);
    if (!agent) {
      throw new AppError('Invalid AI Agent', 400);
    }

    const updated = await ClinicAgent.findOneAndUpdate(
      { clinicId, agentId },
      { status: 'disabled' },
      { new: true }
    );

    if (!updated) {
      throw new AppError('Clinic agent relationship not found.', 404);
    }

    return {
      success: true,
      message: `Agent ${agent.name} has been disabled successfully.`,
      agentId,
      status: updated.status
    };
  }

  /**
   * Record usage log for an agent and update lastUsedAt on ClinicAgent.
   */
  async recordUsage(clinicId: string, agentId: string, action: string, tokensUsed: number = 0, metadata: Record<string, any> = {}) {
    const agent = this.validateAgent(agentId);
    if (!agent) {
      throw new AppError('Invalid AI Agent', 400);
    }

    // Create log
    const usageLog = await AgentUsageLog.create({
      clinicId,
      agentId,
      action,
      tokensUsed,
      metadata
    });

    // Update lastUsedAt on ClinicAgent
    await ClinicAgent.findOneAndUpdate(
      { clinicId, agentId },
      { lastUsedAt: new Date() },
      { upsert: true }
    );

    return usageLog;
  }

  /**
   * Automatically disable extra agents exceeding maxAgents after a subscription downgrade.
   * Enabled agents are sorted by lastUsedAt (ascending), so least recently used agents are disabled first.
   */
  async disableExtraAgentsAfterDowngrade(clinicId: string, targetMaxAgents?: number) {
    let maxAgents = targetMaxAgents;
    if (maxAgents === undefined) {
      const subscription = await Subscription.findOne({ clinicId });
      if (!subscription) {
        throw new AppError('Subscription not found for clinic.', 404);
      }
      maxAgents = subscription.maxAgents;
    }

    const enabledAgents = await ClinicAgent.find({ clinicId, status: 'enabled' });

    if (enabledAgents.length <= maxAgents) {
      return [];
    }

    // Sort by lastUsedAt ascending. Null or undefined lastUsedAt goes first (considered least recently used / never used).
    enabledAgents.sort((a, b) => {
      const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return timeA - timeB;
    });

    const excessCount = enabledAgents.length - maxAgents;
    const toDisable = enabledAgents.slice(0, excessCount);
    const disabledAgentIds: string[] = [];

    for (const record of toDisable) {
      record.status = 'disabled';
      await record.save();
      disabledAgentIds.push(record.agentId);
    }

    return disabledAgentIds.map((id) => {
      const details = this.validateAgent(id);
      return {
        id,
        name: details?.name || id,
        category: details?.category || 'Unknown'
      };
    });
  }

  /**
   * Generate analytics for a clinic's AI agent usage.
   */
  async getAnalytics(clinicId: string) {
    const totalRequests = await AgentUsageLog.countDocuments({ clinicId });

    const activeAgentsCount = await ClinicAgent.countDocuments({
      clinicId,
      status: 'enabled'
    });

    // Aggregation for most used agent and usage by agent
    const usageByAgentAggregation = await AgentUsageLog.aggregate([
      { $match: { clinicId: new mongoose.Types.ObjectId(clinicId) } },
      {
        $group: {
          _id: '$agentId',
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: '$tokensUsed' }
        }
      },
      { $sort: { totalRequests: -1 } }
    ]);

    let mostUsedAgent: { id: string; name: string } | null = null;
    if (usageByAgentAggregation.length > 0) {
      const topAgentId = usageByAgentAggregation[0]._id;
      const agentDetails = this.validateAgent(topAgentId);
      mostUsedAgent = {
        id: topAgentId,
        name: agentDetails ? agentDetails.name : topAgentId
      };
    }

    const usageByAgent = usageByAgentAggregation.map((item) => {
      const agentDetails = this.validateAgent(item._id);
      return {
        id: item._id,
        name: agentDetails ? agentDetails.name : item._id,
        totalRequests: item.totalRequests,
        totalTokens: item.totalTokens
      };
    });

    // Aggregation for daily usage
    const dailyUsageAggregation = await AgentUsageLog.aggregate([
      { $match: { clinicId: new mongoose.Types.ObjectId(clinicId) } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyUsage = dailyUsageAggregation.map((item) => ({
      date: item._id,
      count: item.count
    }));

    return {
      totalRequests,
      mostUsedAgent,
      activeAgents: activeAgentsCount,
      usageByAgent,
      dailyUsage
    };
  }
}

export const agentService = new AgentService();
