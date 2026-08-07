import mongoose, { Schema } from "mongoose";
const SubscriptionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, unique: true },
    planName: { type: String, required: true },
    maxAgents: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "inactive", "cancelled"], default: "active" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  {
    collection: "subscriptions"
  }
);
const Subscription = mongoose.model("Subscription", SubscriptionSchema);
export {
  Subscription
};
