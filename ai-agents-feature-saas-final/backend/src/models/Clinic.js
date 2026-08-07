import mongoose, { Schema } from "mongoose";
const ClinicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  {
    collection: "clinics"
  }
);
const Clinic = mongoose.model("Clinic", ClinicSchema);
export {
  Clinic
};
