import { PaymentMethod } from './PaymentMethod';
import { PaymentResult } from './PaymentResult';
import { ValidationError } from '../../errors';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes PaymentMethod for Credit/Debit cards, masking PCI details and simulating gateway authorization with a 95% success rate. */
export class CardPayment extends PaymentMethod {
  // ENCAPSULATION: Sensitive PAN details are strictly masked and protected
  private readonly _maskedCardNumber: string;
  private readonly _cardHolder: string;
  private readonly _simulatedSuccessRate: number;
  private readonly _fakeDelayMs: number;

  constructor(
    cardNumber: string = '4532750012345678',
    cardHolder: string = 'RideX Customer',
    options?: { simulatedSuccessRate?: number; fakeDelayMs?: number }
  ) {
    super();
    const cleanNumber = (cardNumber && cardNumber.replace(/\s+/g, '').length >= 12 ? cardNumber : '4532750012345678').replace(/\s+/g, '');
    const last4 = cleanNumber.slice(-4);
    // ENCAPSULATION: Store only masked card identifier
    this._maskedCardNumber = `****-****-****-${last4}`;
    this._cardHolder = (cardHolder && cardHolder.trim().length > 0 ? cardHolder : 'RideX Customer').trim();
    this._simulatedSuccessRate = options?.simulatedSuccessRate ?? 0.95;
    this._fakeDelayMs = options?.fakeDelayMs ?? 50;
  }

  public getMethodName(): string {
    return 'CARD';
  }

  public getMaskedCardNumber(): string {
    return this._maskedCardNumber;
  }

  public getCardHolder(): string {
    return this._cardHolder;
  }

  /**
   * POLYMORPHISM: Simulates merchant bank card authorization
   */
  public async pay(amount: number): Promise<PaymentResult> {
    if (amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    // Simulate payment gateway delay
    if (this._fakeDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._fakeDelayMs));
    }

    this._lastTransactionId = this.generateTransactionId('CARD');
    const isSuccess = Math.random() < this._simulatedSuccessRate;

    this._lastResult = {
      success: isSuccess,
      transactionId: this._lastTransactionId,
      amount,
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      message: isSuccess
        ? `Card payment of ₹${amount.toFixed(2)} on card ${this._maskedCardNumber} (${this._cardHolder}) authorized by 3D-Secure gateway.`
        : `Card authorization declined by issuer bank for card ${this._maskedCardNumber}.`,
      timestamp: new Date()
    };

    return this._lastResult;
  }
}

