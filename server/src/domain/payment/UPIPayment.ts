import { PaymentMethod } from './PaymentMethod';
import { PaymentResult } from './PaymentResult';
import { ValidationError } from '../../errors';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes PaymentMethod for UPI (Unified Payments Interface), simulating banking gateway latency and a 95% transaction success rate. */
export class UPIPayment extends PaymentMethod {
  // ENCAPSULATION: Sensitive VPA / UPI ID is private
  private readonly _upiId: string;
  private readonly _simulatedSuccessRate: number;
  private readonly _fakeDelayMs: number;

  constructor(
    upiId: string = 'customer@ridex',
    options?: { simulatedSuccessRate?: number; fakeDelayMs?: number }
  ) {
    super();
    const id = upiId && upiId.includes('@') ? upiId.trim() : 'customer@ridex';
    this._upiId = id;
    this._simulatedSuccessRate = options?.simulatedSuccessRate ?? 0.95;
    this._fakeDelayMs = options?.fakeDelayMs ?? 50;
  }

  public getMethodName(): string {
    return 'UPI';
  }

  public getUpiId(): string {
    return this._upiId;
  }

  /**
   * POLYMORPHISM: Simulates bank gateway response
   */
  public async pay(amount: number): Promise<PaymentResult> {
    if (amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    // Simulate gateway network latency
    if (this._fakeDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._fakeDelayMs));
    }

    this._lastTransactionId = this.generateTransactionId('UPI');
    const isSuccess = Math.random() < this._simulatedSuccessRate;

    this._lastResult = {
      success: isSuccess,
      transactionId: this._lastTransactionId,
      amount,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      message: isSuccess
        ? `UPI payment of ₹${amount.toFixed(2)} to VPA ${this._upiId} successfully authorized by NPCI.`
        : `UPI transaction failed: Bank server timeout or insufficient funds in linked account for ${this._upiId}.`,
      timestamp: new Date()
    };

    return this._lastResult;
  }
}

