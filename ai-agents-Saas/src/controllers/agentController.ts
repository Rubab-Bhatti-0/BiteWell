import { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const getAgents = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const agents = await agentService.getAllAgents(clinicId);
  res.status(200).json(agents);
});

export const logUsage = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const { agentId } = req.params;
  const { action, tokensUsed, metadata } = req.body;

  if (!agentService.validateAgent(agentId)) {
    throw new AppError('Invalid AI Agent', 400);
  }

  const usageLog = await agentService.recordUsage(
    clinicId,
    agentId,
    action,
    tokensUsed || 0,
    metadata || {}
  );

  res.status(201).json({
    success: true,
    message: 'Agent usage logged successfully.',
    data: usageLog
  });
});
