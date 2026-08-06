import { Router } from 'express';
import { z } from 'zod';
import { getAgents, logUsage } from '../controllers/agentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const usageSchema = z.object({
  body: z.object({
    action: z.string().min(1, 'Action string is required'),
    tokensUsed: z.number().optional().default(0),
    metadata: z.record(z.any()).optional().default({})
  }),
  params: z.object({
    agentId: z.string().min(1)
  })
});

const agentIdParamSchema = z.object({
  params: z.object({
    agentId: z.string().min(1)
  })
});

// All agent routes require JWT authentication
router.use(authenticate);

// GET /api/agents - Get all available AI agents with calculated enabled status
router.get('/', getAgents);

// POST /api/agents/:agentId/usage - Log agent usage
router.post('/:agentId/usage', validate(usageSchema), logUsage);

export default router;
