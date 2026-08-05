import { Router } from 'express';
import { z } from 'zod';
import { downgradeSubscription } from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const downgradeSchema = z.object({
  body: z.object({
    planName: z.string().min(1, 'planName is required'),
    maxAgents: z.number().int().min(0, 'maxAgents must be a non-negative integer')
  })
});

router.use(authenticate);

// POST /api/subscription/downgrade - Downgrade plan & disable extra agents
router.post('/downgrade', validate(downgradeSchema), downgradeSubscription);

export default router;
