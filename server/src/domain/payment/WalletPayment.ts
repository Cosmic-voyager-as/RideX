import { PaymentMethod } from './PaymentMethod';
import { PaymentResult } from './PaymentResult';
import { Customer } from '../Customer';
import { ValidationError, InsufficientFundsError } from '../../errors';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes PaymentMethod for closed-loop in-app digital wallet transactions by debiting the Customer's encapsulated Wallet entity. */
export class WalletPayment extends PaymentMethod {
  // ENCAPSULATION: Reference to customer is private
  private readonly _customer: Customer;

  constructor(customer: Customer) {
    super();
    if (!customer) {
      throw new ValidationError('Customer reference is required for wallet payment');
    }
    this._customer = customer;
  }

  public getMethodName(): string {
    return 'WALLET';
  }

  /**
   * POLYMORPHISM: Debits the customer's encapsulated wallet directly
   */
  public async pay(amount: number): Promise<PaymentResult> {
    if (amount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero');
    }

    this._lastTransactionId = this.generateTransactionId('WALLET');

    try {
      // ENCAPSULATION: Customer's wallet balance changes solely through its validated debit() method
      this._customer.getWallet().debit(amount, `Ride payment ref ${this._lastTransactionId}`);

      this._lastResult = {
        success: true,
        transactionId: this._lastTransactionId,
        amount,
        status: 'COMPLETED',
        message: `Successfully debited ₹${amount.toFixed(2)} from in-app wallet. New balance: ₹${this._customer.getWallet().getBalance().toFixed(2)}`,
        timestamp: new Date()
      };
      return this._lastResult;
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        this._lastResult = {
          success: false,
          transactionId: this._lastTransactionId,
          amount,
          status: 'FAILED',
          message: error.message,
          timestamp: new Date()
        };
        return this._lastResult;
      }
      throw error;
    }
  }

  public getCustomer(): Customer {
    return this._customer;
  }
}

