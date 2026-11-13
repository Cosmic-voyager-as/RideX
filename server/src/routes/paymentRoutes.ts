import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

export function createPaymentRouter(
  paymentController: PaymentController,
  authenticate: (req: any, res: any, next: any) => void
): Router {
  const router = Router();

  // Public config (Key ID)
  router.get('/razorpay/config', paymentController.getConfig);

  // Authenticated endpoints
  router.post('/razorpay/create-order', authenticate, paymentController.createOrder);
  router.post('/razorpay/verify-payment', authenticate, paymentController.verifyPayment);

  return router;
}

