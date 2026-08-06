import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`🚨 Clinical System Error Catch: [${req.method}] ${req.originalUrl}`);
  console.error(err.stack || err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal clinical system transaction exception occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Resource Not Found - Endpoint ${req.originalUrl} does not exist.`);
  res.status(404);
  next(error);
};
