import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import agentRoutes from './routes/agentRoutes';
import clinicAgentRoutes from './routes/clinicAgentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { errorHandler, AppError } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'Dental SaaS AI Agent Backend' });
});

// Root Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Dental SaaS AI Agent Backend API',
    message: 'Backend server is running successfully.',
    frontendDashboardUrl: 'http://localhost:3000/dashboard/ai-agents'
  });
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/clinic/agents', clinicAgentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Catch-all 404 route
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('API endpoint not found', 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
