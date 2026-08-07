import mongoose, { Schema } from "mongoose";
const ClinicAgentSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
    agentId: { type: String, required: true },
    status: { type: String, enum: ["enabled", "disabled"], default: "enabled" },
    enabledAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date }
  },
  {
    collection: "clinicAgents"
  }
);
ClinicAgentSchema.index({ clinicId: 1, agentId: 1 }, { unique: true });
const ClinicAgent = mongoose.model("ClinicAgent", ClinicAgentSchema);
export {
  ClinicAgent
};
