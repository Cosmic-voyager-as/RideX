import { Router } from 'express';
import { DriverController } from '../controllers/DriverController';
import { Role } from '../domain/User';

export function createDriverRouter(
  driverController: DriverController,
  authenticate: (req: any, res: any, next: any) => void,
  authorize: (...roles: Role[]) => (req: any, res: any, next: any) => void
): Router {
  const router = Router();

  router.use(authenticate);
  router.use(authorize('DRIVER'));

  // POST /driver/status (online | offline)
  router.post('/status', driverController.setStatus);

  // POST /driver/location (update GPS coordinates)
  router.post('/location', driverController.updateLocation);

  // GET /driver/requests (available requested rides)
  router.get('/requests', driverController.getRequests);

  // POST /driver/rides/:id/accept
  router.post('/rides/:id/accept', driverController.acceptRide);

  // POST /driver/rides/:id/arrive
  router.post('/rides/:id/arrive', driverController.arriveAtPickup);

  // POST /driver/rides/:id/start
  router.post('/rides/:id/start', driverController.startTrip);

  // POST /driver/rides/:id/complete
  router.post('/rides/:id/complete', driverController.completeTrip);

  // GET /driver/earnings
  router.get('/earnings', driverController.getEarnings);

  return router;
}

