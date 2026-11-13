import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { Role } from '../domain/User';

export function createCustomerRouter(
  customerController: CustomerController,
  authenticate: (req: any, res: any, next: any) => void,
  authorize: (...roles: Role[]) => (req: any, res: any, next: any) => void
): Router {
  const router = Router();

  router.use(authenticate);
  router.use(authorize('CUSTOMER'));

  router.get('/wallet', customerController.getWallet);
  router.post('/wallet/topup', customerController.topUpWallet);
  router.get('/saved-places', customerController.getSavedPlaces);
  router.post('/saved-places', customerController.addSavedPlace);
  router.post('/promo/apply', customerController.applyPromo);

  return router;
}

