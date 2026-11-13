import { Request, Response, NextFunction } from 'express';
import { IRazorpayService } from '../services/RazorpayService';
import { UserRepository } from '../repositories/UserRepository';
import { Customer } from '../domain/Customer';
import { RazorpayPayment } from '../domain/payment/RazorpayPayment';
import { ValidationError, UnauthorizedError } from '../errors';

/** OOP: Abstraction
 *  WHY: Thin controller adapter exposing Razorpay payment capabilities (order creation, signature validation, wallet settlement) without leaking gateway internals into domain entities. */
export class PaymentController {
  private readonly _razorpayService: IRazorpayService;
  private readonly _userRepo: UserRepository;

  constructor(razorpayService: IRazorpayService, userRepo: UserRepository) {
    this._razorpayService = razorpayService;
    this._userRepo = userRepo;
  }

  /**
   * GET /api/payment/razorpay/config
   * Returns public client key ID for Razorpay Checkout
   */
  public getConfig = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: 'SUCCESS',
      data: {
        keyId: this._razorpayService.getKeyId(),
        currency: 'INR'
      }
    });
  };

  /**
   * POST /api/payment/razorpay/create-order
   * Creates an order with Razorpay
   */
  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, purpose = 'WALLET_TOPUP' } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new ValidationError('Valid payment amount is required');
      }

      const prefix = purpose === 'WALLET_TOPUP' ? 'wal' : 'ride';
      const order = await this._razorpayService.createOrder(amount, 'INR', prefix);

      res.status(200).json({
        status: 'SUCCESS',
        data: order
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/payment/razorpay/verify-payment
   * Verifies payment signature and settles wallet balance or ride fare
   */
  public verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, paymentId, signature, amount, purpose = 'WALLET_TOPUP' } = req.body;

      if (!orderId || !paymentId || !signature) {
        throw new ValidationError('orderId, paymentId, and signature are required for verification');
      }

      const isValid = this._razorpayService.verifyPayment(orderId, paymentId, signature);

      if (!isValid) {
        res.status(400).json({
          status: 'ERROR',
          message: 'Razorpay payment signature verification failed'
        });
        return;
      }

      // Instantiate polymorphic RazorpayPayment entity
      const paymentEntity = new RazorpayPayment(orderId, paymentId, signature);
      await paymentEntity.pay(amount || 0);

      // Handle Wallet Top-Up settlement
      if (purpose === 'WALLET_TOPUP') {
        const userId = (req as any).user?.id;
        if (!userId) {
          throw new UnauthorizedError('Authentication required to top up wallet');
        }

        const user = this._userRepo.findById(userId);
        if (!user || !(user instanceof Customer)) {
          throw new ValidationError('Customer account not found for wallet top-up');
        }

        const creditAmount = Number(amount);
        const description = `Razorpay Top-Up (ID: ${paymentId})`;
        user.getWallet().credit(creditAmount, description);
        this._userRepo.save(user);

        res.status(200).json({
          status: 'SUCCESS',
          data: {
            verified: true,
            receipt: paymentEntity.receipt(),
            paymentId,
            orderId,
            newBalance: user.getWallet().getBalance(),
            message: `Successfully credited ₹${creditAmount} via Razorpay Gateway`
          }
        });
        return;
      }

      // Handle Ride Payment settlement
      res.status(200).json({
        status: 'SUCCESS',
        data: {
          verified: true,
          receipt: paymentEntity.receipt(),
          paymentId,
          orderId,
          message: 'Ride payment verified and captured via Razorpay'
        }
      });
    } catch (err) {
      next(err);
    }
  };
}

