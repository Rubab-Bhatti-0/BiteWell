import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Clinic } from '../models/Clinic';
import { Subscription } from '../models/Subscription';
import { JWT_SECRET } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const registerClinic = asyncHandler(async (req: Request, res: Response) => {
  const { name, ownerId, email, planName = 'Standard', maxAgents = 3 } = req.body;

  let existing = await Clinic.findOne({ email });
  if (existing) {
    throw new AppError('Clinic email already registered.', 400);
  }

  const clinic = await Clinic.create({
    name,
    ownerId,
    email
  });

  const subscription = await Subscription.create({
    clinicId: clinic._id,
    planName,
    maxAgents,
    status: 'active',
    startDate: new Date()
  });

  const token = jwt.sign(
    { clinicId: clinic._id.toString(), email: clinic.email, ownerId: clinic.ownerId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'Clinic registered successfully.',
    token,
    clinic: {
      id: clinic._id,
      name: clinic.name,
      email: clinic.email
    },
    subscription: {
      planName: subscription.planName,
      maxAgents: subscription.maxAgents,
      status: subscription.status
    }
  });
});

export const loginClinic = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const clinic = await Clinic.findOne({ email });
  if (!clinic) {
    throw new AppError('Clinic not found with this email.', 404);
  }

  const subscription = await Subscription.findOne({ clinicId: clinic._id });

  const token = jwt.sign(
    { clinicId: clinic._id.toString(), email: clinic.email, ownerId: clinic.ownerId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    success: true,
    token,
    clinic: {
      id: clinic._id,
      name: clinic.name,
      email: clinic.email
    },
    subscription: subscription ? {
      planName: subscription.planName,
      maxAgents: subscription.maxAgents,
      status: subscription.status
    } : null
  });
});
