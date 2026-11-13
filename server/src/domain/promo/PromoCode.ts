import { Customer } from '../Customer';
import { Fare } from '../pricing/Fare';
import { ValidationError } from '../../errors';

/** OOP: Encapsulation
 *  WHY: Encapsulates promotional voucher validation rules, coupon usage quotas, and expiration checks, exposing state mutation only through validated apply() operations. */
export class PromoCode {
  // ENCAPSULATION: Private attributes protect coupon economics from external tampering
  private readonly _id: string;
  private readonly _code: string;
  private readonly _discountPercentage: number;
  private readonly _maxDiscount: number;
  private readonly _minFare: number;
  // ENCAPSULATION: Usage count is private and increments only upon successful application
  private _usageCount: number;
  private readonly _maxUsage: number;
  // ENCAPSULATION: Expiration timestamp is private
  private readonly _expiresAt: Date;
  private _isActive: boolean;
  private readonly _allowedCustomerIds?: string[];

  constructor(
    id: string,
    code: string,
    discountPercentage: number,
    maxDiscount: number,
    minFare: number = 0.0,
    expiresAt: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    maxUsage: number = 100,
    initialUsageCount: number = 0,
    isActive: boolean = true,
    allowedCustomerIds?: string[]
  ) {
    if (!code || code.trim().length === 0) {
      throw new ValidationError('Promo code string is required');
    }
    if (discountPercentage <= 0 || discountPercentage > 100) {
      throw new ValidationError(`Discount percentage must be between 1 and 100. Received: ${discountPercentage}`);
    }
    if (maxDiscount <= 0) {
      throw new ValidationError('Max discount amount must be greater than zero');
    }
    if (minFare < 0) {
      throw new ValidationError('Minimum fare requirement cannot be negative');
    }

    this._id = id;
    this._code = code.trim().toUpperCase();
    this._discountPercentage = discountPercentage;
    this._maxDiscount = maxDiscount;
    this._minFare = minFare;
    this._expiresAt = new Date(expiresAt.getTime());
    this._maxUsage = maxUsage;
    this._usageCount = initialUsageCount;
    this._isActive = isActive;
    this._allowedCustomerIds = allowedCustomerIds ? [...allowedCustomerIds] : undefined;
  }

  // ENCAPSULATION: Read-only accessors
  public getId(): string {
    return this._id;
  }

  public getCode(): string {
    return this._code;
  }

  public getDiscountPercentage(): number {
    return this._discountPercentage;
  }

  public getMaxDiscount(): number {
    return this._maxDiscount;
  }

  public getMinFare(): number {
    return this._minFare;
  }

  public getUsageCount(): number {
    return this._usageCount;
  }

  public getMaxUsage(): number {
    return this._maxUsage;
  }

  public getExpiresAt(): Date {
    return new Date(this._expiresAt.getTime());
  }

  public isActive(): boolean {
    return this._isActive;
  }

  public isExpired(): boolean {
    return Date.now() > this._expiresAt.getTime();
  }

  /**
   * Evaluates if a given customer and trip qualify for this promotional discount
   */
  public isValidFor(customer: Customer, currentFare?: Fare): boolean {
    if (!this._isActive) {
      return false;
    }
    if (this.isExpired()) {
      return false;
    }
    if (this._usageCount >= this._maxUsage) {
      return false;
    }
    if (this._allowedCustomerIds && customer) {
      if (!this._allowedCustomerIds.includes(customer.getId())) {
        return false;
      }
    }
    if (currentFare && currentFare.total < this._minFare) {
      return false;
    }
    return true;
  }

  /**
   * ENCAPSULATION: Applies promotional discount to an immutable Fare, incrementing internal private usage counter
   */
  public apply(fare: Fare, customer?: Customer): Fare {
    if (customer && !this.isValidFor(customer, fare)) {
      throw new ValidationError(
        `Promo code '${this._code}' is not valid for customer '${customer.getName()}' or ride parameters`
      );
    }
    if (!customer && (!this._isActive || this.isExpired() || this._usageCount >= this._maxUsage)) {
      throw new ValidationError(`Promo code '${this._code}' is inactive, expired, or fully redeemed`);
    }

    const rawSubtotal =
      fare.base + (fare.distanceCharge + fare.timeCharge) * fare.surgeMultiplier;

    const discountAmount = Math.min(
      Math.round(rawSubtotal * (this._discountPercentage / 100) * 100) / 100,
      this._maxDiscount
    );

    // ENCAPSULATION: Safe mutation of internal private usage count
    this._usageCount++;

    return new Fare(
      fare.base,
      fare.distanceCharge,
      fare.timeCharge,
      fare.surgeMultiplier,
      discountAmount
    );
  }
}

