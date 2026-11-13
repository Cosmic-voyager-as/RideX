import { IPricingStrategy } from './IPricingStrategy';
import { Vehicle } from '../Vehicle';
import { Fare } from './Fare';
import { ValidationError } from '../../errors';

/** OOP: Polymorphism, Abstraction (Decorator Pattern)
 *  WHY: Decorates any existing IPricingStrategy to apply promotional discounts dynamically without modifying the decorated strategy's code. */
export class PromoPricing implements IPricingStrategy {
  // ABSTRACTION & ENCAPSULATION: Holds a reference to the abstract IPricingStrategy contract
  private readonly _innerStrategy: IPricingStrategy;
  private readonly _discountPercentage: number;
  private readonly _maxDiscount: number | null;

  constructor(
    innerStrategy: IPricingStrategy,
    discountPercentage: number,
    maxDiscount: number | null = null
  ) {
    if (!innerStrategy) {
      throw new ValidationError('Inner pricing strategy is required for PromoPricing decorator');
    }
    if (discountPercentage <= 0 || discountPercentage > 100) {
      throw new ValidationError(`Discount percentage must be between 1 and 100. Received: ${discountPercentage}`);
    }
    if (maxDiscount !== null && maxDiscount <= 0) {
      throw new ValidationError('Maximum discount must be positive');
    }

    this._innerStrategy = innerStrategy;
    this._discountPercentage = discountPercentage;
    this._maxDiscount = maxDiscount;
  }

  /**
   * POLYMORPHISM: Delegates calculation to decorated strategy, then applies promotional discount
   */
  public calculate(distanceKm: number, durationMin: number, vehicle: Vehicle): Fare {
    // 1. Delegate to underlying decorated strategy
    const rawFare = this._innerStrategy.calculate(distanceKm, durationMin, vehicle);

    // 2. Compute subtotal before tax and discount
    const rawSubtotal =
      rawFare.base + (rawFare.distanceCharge + rawFare.timeCharge) * rawFare.surgeMultiplier;

    // 3. Compute discount amount with optional ceiling cap
    let discountAmount = rawSubtotal * (this._discountPercentage / 100);
    if (this._maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, this._maxDiscount);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    // 4. Return new immutable Fare with discount
    return new Fare(
      rawFare.base,
      rawFare.distanceCharge,
      rawFare.timeCharge,
      rawFare.surgeMultiplier,
      discountAmount
    );
  }
}

