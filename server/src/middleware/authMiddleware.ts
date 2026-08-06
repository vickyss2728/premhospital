import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clinical_billing_secret_token_123';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'owner' | 'billing';
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: No authentication token provided in authorization headers.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: 'owner' | 'billing';
    };

    // Attach user profile to request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session Expired or Invalid Token: Access unauthorized.'
    });
  }
};

// Middleware to restrict access to Owner accounts
export const authorizeOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access Forbidden: This transaction requires administrative Owner privileges.'
    });
  }
};
