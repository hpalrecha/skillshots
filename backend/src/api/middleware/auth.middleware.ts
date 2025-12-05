// Fix for Request type resolution issue by aliasing the import.
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';

export interface AuthRequest extends ExpressRequest {
  user?: {
    id: string;
  };
}

export const protect = async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
  let token;

  // Cast req to any to safely access headers when type definitions are incomplete
  const reqWithHeaders = req as any;

  if (reqWithHeaders.headers.authorization && reqWithHeaders.headers.authorization.startsWith('Bearer')) {
    try {
      token = reqWithHeaders.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true }
      });

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};