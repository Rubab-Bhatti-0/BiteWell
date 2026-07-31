import mongoose from 'mongoose';

const ClinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String, default: '' },
  ownerName: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  brandColor: { type: String, default: '' },
  workingHours: [
    {
      day: { type: String },
      open: { type: String },
      close: { type: String }
    }
  ],
  subscriptionPlan: { type: String, enum: ['free', 'standard', 'premium'], default: 'free' },
  subscriptionStatus: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  subscriptionExpiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Clinic', ClinicSchema);
