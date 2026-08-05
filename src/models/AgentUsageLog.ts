import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentUsageLog extends Document {
  clinicId: mongoose.Types.ObjectId;
  agentId: string;
  action: string;
  tokensUsed: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

const AgentUsageLogSchema: Schema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
    agentId: { type: String, required: true },
    action: { type: String, required: true },
    tokensUsed: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: 'agentUsageLogs'
  }
);

// Index for efficient aggregation by clinic, agent, and date
AgentUsageLogSchema.index({ clinicId: 1, agentId: 1, createdAt: -1 });

export const AgentUsageLog = mongoose.model<IAgentUsageLog>('AgentUsageLog', AgentUsageLogSchema);
