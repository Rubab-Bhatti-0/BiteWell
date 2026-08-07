import mongoose, { Schema } from "mongoose";
const AgentUsageLogSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    agentId: { type: String, required: true },
    action: { type: String, required: true },
    tokensUsed: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: "agentUsageLogs"
  }
);
AgentUsageLogSchema.index({ clinicId: 1, agentId: 1, createdAt: -1 });
const AgentUsageLog = mongoose.model("AgentUsageLog", AgentUsageLogSchema);
export {
  AgentUsageLog
};
