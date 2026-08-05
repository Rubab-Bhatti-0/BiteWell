import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/analytics/agents - Get AI agent usage analytics
router.get('/agents', getAnalytics);

export default router;
