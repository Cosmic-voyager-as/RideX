import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { IRepository } from '../repositories/IRepository';
import { User, Role } from '../domain/User';
import { UnauthorizedError, ForbiddenError } from '../errors';

// Extend Express Request declaration to include authenticated User entity
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/** OOP: Abstraction, Polymorphism
 *  WHY: Implements role-based access control driven polymorphically by User.getRole() without coupling to concrete User classes. */
export function createAuthMiddleware(authService: AuthService, userRepo: IRepository<User>) {
  const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required: Bearer token missing');
    }

    const token = authHeader.split(' ')[1];
    const payload = authService.verifyToken(token);

    const user = userRepo.findById(payload.id);
    if (!user) {
      throw new UnauthorizedError('User referenced by token no longer exists');
    }

    req.user = user;
    next();
  };

  /**
   * POLYMORPHISM: Authorizes requests dynamically based on the polymorphic User.getRole() method
   */
  const authorize = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        throw new UnauthorizedError('Unauthenticated request');
      }

      // POLYMORPHISM: Access control decision driven by polymorphic method call
      const userRole = req.user.getRole();

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(
          `Forbidden: Endpoint requires role [${allowedRoles.join(', ')}]. Current role is '${userRole}'`
        );
      }

      next();
    };
  };

  return { authenticate, authorize };
}

