import { Router } from 'express';
import { RideController } from '../controllers/RideController';
import { Role } from '../domain/User';

export function createRideRouter(
  rideController: RideController,
  authenticate: (req: any, res: any, next: any) => void,
  authorize: (...roles: Role[]) => (req: any, res: any, next: any) => void
): Router {
  const router = Router();

  // Public trip tracking (share trip link) - unauthenticated
  router.get('/track/:token', rideController.track);

  // All subsequent ride endpoints require authentication
  router.use(authenticate);

  // POST /rides/estimate - Customer role required
  router.post('/estimate', authorize('CUSTOMER'), rideController.estimate);

  // POST /rides - Customer role required
  router.post('/', authorize('CUSTOMER'), rideController.book);

  // GET /rides/mine - Customer role required
  router.get('/mine', authorize('CUSTOMER'), rideController.getMine);

  // GET /rides/:id - Customer or Driver or Admin
  router.get('/:id', rideController.getById);

  // POST /rides/:id/cancel - Customer role required
  router.post('/:id/cancel', authorize('CUSTOMER'), rideController.cancel);

  // POST /rides/:id/rate - Customer role required
  router.post('/:id/rate', authorize('CUSTOMER'), rideController.rate);

  return router;
}

