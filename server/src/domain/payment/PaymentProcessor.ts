import { IPaymentMethod } from './IPaymentMethod';
import { PaymentResult } from './PaymentResult';
import { ValidationError } from '../../errors';

/** OOP: Abstraction, Polymorphism
 *  WHY: Orchestrates transaction settlement by interacting exclusively with the IPaymentMethod contract, executing any payment channel polymorphically without type checks. */
export class PaymentProcessor {
  /**
   * POLYMORPHISM: Settles transaction against ANY payment method without `if (method instanceof ...)` or `switch (method.type)`
   */
  public async process(method: IPaymentMethod, amount: number): Promise<PaymentResult> {
    if (!method) {
      throw new ValidationError('Payment method contract is required');
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new ValidationError(`Valid positive transaction amount is required. Received: ${amount}`);
    }

    // POLYMORPHISM: Runtime polymorphic dispatch executes concrete pay() specialization
    return await method.pay(amount);
  }
}

