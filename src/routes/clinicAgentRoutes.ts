import { Router } from 'express';
import { z } from 'zod';
import { getClinicAgents, enableAgent, disableAgent } from '../controllers/clinicAgentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const agentParamSchema = z.object({
  params: z.object({
    agentId: z.string().min(1, 'agentId parameter is required')
  })
});

// All clinic agent routes require JWT authentication
router.use(authenticate);

// GET /api/clinic/agents - Get enabled agents for logged-in clinic
router.get('/', getClinicAgents);

// POST /api/clinic/agents/:agentId/enable - Enable an AI agent
router.post('/:agentId/enable', validate(agentParamSchema), enableAgent);

// POST /api/clinic/agents/:agentId/disable - Disable an AI agent
router.post('/:agentId/disable', validate(agentParamSchema), disableAgent);

export default router;
