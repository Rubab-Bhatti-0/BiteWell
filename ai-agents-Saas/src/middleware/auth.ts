import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthPayload {
  clinicId: string;
  email: string;
  ownerId?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      clinicId?: string;
    }
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dental-saas-secret-key-12345';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token required. Standard format: Bearer <token>', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (!decoded.clinicId) {
      return next(new AppError('Invalid token payload: missing clinicId', 401));
    }
    req.user = decoded;
    req.clinicId = decoded.clinicId;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};
