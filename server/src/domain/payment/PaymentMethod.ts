import { IPaymentMethod } from './IPaymentMethod';
import { PaymentResult, PaymentReceipt } from './PaymentResult';
import { ValidationError } from '../../errors';

/** OOP: Abstraction, Inheritance
 *  WHY: Serves as the abstract base class for payment implementations, encapsulating transaction ID generation and standardizing receipt creation. */
export abstract class PaymentMethod implements IPaymentMethod {
  // ENCAPSULATION: Transaction records and audit states are protected from outside mutation
  protected _lastTransactionId: string | null = null;
  protected _lastResult: PaymentResult | null = null;

  constructor() {
    if (new.target === PaymentMethod) {
      throw new Error('Cannot instantiate abstract class PaymentMethod directly');
    }
  }

  /**
   * ENCAPSULATION & INHERITANCE: Protected transaction ID generator available to derived payment channels
   */
  protected generateTransactionId(prefix: string): string {
    const randomSuffix = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}_${Date.now()}_${randomSuffix}`;
  }

  // ABSTRACTION: Force derived payment channels to identify their channel
  public abstract getMethodName(): string;

  // ABSTRACTION & POLYMORPHISM: Derived payment channels execute their specialized payment gateway logic
  public abstract pay(amount: number): Promise<PaymentResult>;

  /**
   * INHERITANCE: Concrete receipt implementation shared across all derived payment methods (Template/Inherited method)
   */
  public receipt(): PaymentReceipt {
    if (!this._lastResult) {
      throw new ValidationError('Cannot generate receipt before a payment is processed');
    }

    return {
      receiptId: `RCP_${this._lastResult.transactionId}`,
      transactionId: this._lastResult.transactionId,
      method: this.getMethodName(),
      amount: this._lastResult.amount,
      status: this._lastResult.status,
      timestamp: this._lastResult.timestamp,
      details: this._lastResult.message
    };
  }
}

