import { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const getClinicAgents = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const enabledAgents = await agentService.getEnabledAgents(clinicId);
  res.status(200).json(enabledAgents);
});

export const enableAgent = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const { agentId } = req.params;

  if (!agentService.validateAgent(agentId)) {
    throw new AppError('Invalid AI Agent', 400);
  }

  const result = await agentService.enableAgent(clinicId, agentId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: `AI Agent '${agentId}' enabled successfully.`,
    data: result.data
  });
});

export const disableAgent = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const { agentId } = req.params;

  if (!agentService.validateAgent(agentId)) {
    throw new AppError('Invalid AI Agent', 400);
  }

  const result = await agentService.disableAgent(clinicId, agentId);
  res.status(200).json(result);
});
