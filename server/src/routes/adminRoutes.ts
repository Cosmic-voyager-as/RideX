import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { Role } from '../domain/User';

export function createAdminRouter(
  adminController: AdminController,
  authenticate: (req: any, res: any, next: any) => void,
  authorize: (...roles: Role[]) => (req: any, res: any, next: any) => void
): Router {
  const router = Router();

  router.use(authenticate);
  router.use(authorize('ADMIN'));

  // GET /admin/users
  router.get('/users', adminController.getUsers);

  // PATCH /admin/users/:id/block
  router.patch('/users/:id/block', adminController.blockUser);

  // GET /admin/rides
  router.get('/rides', adminController.getRides);

  // GET /admin/analytics
  router.get('/analytics', adminController.getAnalytics);

  // POST /admin/matching-strategy (Nearest | HighestRated | Balanced)
  router.post('/matching-strategy', adminController.setMatchingStrategy);

  // GET /admin/sos (Emergency alerts)
  router.get('/sos', adminController.getSosAlerts);

  return router;
}

