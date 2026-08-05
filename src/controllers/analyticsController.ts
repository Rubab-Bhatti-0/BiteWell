import { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { asyncHandler } from '../middleware/errorHandler';

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const analytics = await agentService.getAnalytics(clinicId);
  res.status(200).json(analytics);
});
