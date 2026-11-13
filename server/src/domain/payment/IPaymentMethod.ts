import { PaymentResult, PaymentReceipt } from './PaymentResult';

/** OOP: Abstraction
 *  WHY: Establishes a payment processing contract allowing heterogeneous payment gateways to be processed polymorphically. */
export interface IPaymentMethod {
  /**
   * Returns channel identifier
   */
  getMethodName(): string;

  /**
   * POLYMORPHISM: Executes the payment transaction asynchronously.
   */
  pay(amount: number): Promise<PaymentResult>;

  /**
   * Generates a concrete audit receipt for completed or pending transactions.
   */
  receipt(): PaymentReceipt;
}
