import { PaymentMethod } from './PaymentMethod';
import { PaymentResult } from './PaymentResult';
import { ValidationError } from '../../errors';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes PaymentMethod for physical cash transactions, marking the status as PENDING until confirmed by the driver. */
export class CashPayment extends PaymentMethod {
  // ENCAPSULATION: Driver confirmation state is private
  private _isConfirmedByDriver: boolean = false;

  public getMethodName(): string {
    return 'CASH';
  }

  /**
   * POLYMORPHISM: Processes cash by generating pending transaction record
   */
  public async pay(amount: number): Promise<PaymentResult> {
    if (amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    this._lastTransactionId = this.generateTransactionId('CASH');
    this._lastResult = {
      success: true,
      transactionId: this._lastTransactionId,
      amount,
      status: 'PENDING',
      message: 'Cash payment initiated. Awaiting physical cash settlement and driver confirmation.',
      timestamp: new Date()
    };

    return this._lastResult;
  }

  /**
   * Driver confirms receiving the physical cash in hand
   */
  public confirmByDriver(): void {
    if (!this._lastResult) {
      throw new ValidationError('No active cash transaction to confirm');
    }
    this._isConfirmedByDriver = true;
    this._lastResult = {
      ...this._lastResult,
      status: 'COMPLETED',
      message: 'Cash received and confirmed by driver.'
    };
  }

  public isConfirmedByDriver(): boolean {
    return this._isConfirmedByDriver;
  }
}

