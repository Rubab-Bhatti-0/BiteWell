import { Router } from 'express';
import { z } from 'zod';
import { registerClinic, loginClinic } from '../controllers/authController';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Clinic name is required'),
    ownerId: z.string().min(1, 'Owner ID is required'),
    email: z.string().email('Invalid email address'),
    planName: z.string().optional(),
    maxAgents: z.number().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

router.post('/register', validate(registerSchema), registerClinic);
router.post('/login', validate(loginSchema), loginClinic);

export default router;
