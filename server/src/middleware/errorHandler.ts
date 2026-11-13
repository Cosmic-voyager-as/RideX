import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/** OOP: Polymorphism
 *  WHY: Maps error hierarchy to HTTP responses polymorphically by delegating status code resolution directly to AppError subclasses without type checks. */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // POLYMORPHISM: AppError subclasses define their own HTTP status codes at runtime
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'ERROR',
      error: err.constructor.name,
      message: err.message,
      statusCode: err.statusCode
    });
    return;
  }

  // Fallback for unexpected system errors
  console.error('[Unhandled Internal Error]:', err);
  res.status(500).json({
    status: 'FATAL',
    error: 'InternalServerError',
    message: err.message || 'An unexpected internal error occurred',
    statusCode: 500
  });
}

