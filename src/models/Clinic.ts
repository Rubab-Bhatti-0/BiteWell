import mongoose, { Schema, Document } from 'mongoose';

export interface IClinic extends Document {
  name: string;
  ownerId: string;
  email: string;
  createdAt: Date;
}

const ClinicSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: 'clinics'
  }
);

export const Clinic = mongoose.model<IClinic>('Clinic', ClinicSchema);
