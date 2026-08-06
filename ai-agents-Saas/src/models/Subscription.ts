import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  clinicId: mongoose.Types.ObjectId;
  planName: string;
  maxAgents: number;
  status: 'active' | 'inactive' | 'cancelled';
  startDate: Date;
  endDate?: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true, unique: true },
    planName: { type: String, required: true },
    maxAgents: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  {
    collection: 'subscriptions'
  }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
