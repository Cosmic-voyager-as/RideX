import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

export function createAuthRouter(
  authController: AuthController,
  authenticate: (req: any, res: any, next: any) => void
): Router {
  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/google', authController.googleLogin);
  router.get('/me', authenticate, authController.me);

  return router;
}

