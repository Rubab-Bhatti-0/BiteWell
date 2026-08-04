import mongoose, { Schema, Document } from 'mongoose';

export interface IClinicAgent extends Document {
  clinicId: mongoose.Types.ObjectId;
  agentId: string;
  status: 'enabled' | 'disabled';
  enabledAt: Date;
  lastUsedAt?: Date;
}

const ClinicAgentSchema: Schema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
    agentId: { type: String, required: true },
    status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
    enabledAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date }
  },
  {
    collection: 'clinicAgents'
  }
);

// Ensure a clinic has at most one record per agentId
ClinicAgentSchema.index({ clinicId: 1, agentId: 1 }, { unique: true });

export const ClinicAgent = mongoose.model<IClinicAgent>('ClinicAgent', ClinicAgentSchema);
