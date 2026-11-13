import { ValidationError } from '../../errors';

/** OOP: Encapsulation
 *  WHY: Models fare as an immutable value object with read-only breakdown fields, preventing post-computation corruption of financial data. */
export class Fare {
  // ENCAPSULATION: All fare component attributes are readonly to ensure immutability
  public readonly base: number;
  public readonly distanceCharge: number;
  public readonly timeCharge: number;
  public readonly surgeMultiplier: number;
  public readonly discount: number;
  public readonly tax: number;
  public readonly total: number;
  public readonly currency: string = 'INR';

  constructor(
    base: number,
    distanceCharge: number,
    timeCharge: number,
    surgeMultiplier: number = 1.0,
    discount: number = 0.0,
    tax?: number,
    total?: number
  ) {
    if (base < 0 || distanceCharge < 0 || timeCharge < 0) {
      throw new ValidationError('Fare base and charges must be non-negative values');
    }
    if (surgeMultiplier < 1.0) {
      throw new ValidationError('Surge multiplier cannot be less than 1.0');
    }
    if (discount < 0) {
      throw new ValidationError('Discount cannot be negative');
    }

    this.base = Math.round(base * 100) / 100;
    this.distanceCharge = Math.round(distanceCharge * 100) / 100;
    this.timeCharge = Math.round(timeCharge * 100) / 100;
    this.surgeMultiplier = Math.round(surgeMultiplier * 100) / 100;

    // Subtotal with surge multiplier applied to distance and time
    const rawSubtotal = this.base + (this.distanceCharge + this.timeCharge) * this.surgeMultiplier;
    
    // Discount cannot exceed subtotal
    this.discount = Math.min(Math.round(discount * 100) / 100, Math.round(rawSubtotal * 100) / 100);
    const subtotalAfterDiscount = Math.max(0, rawSubtotal - this.discount);

    // 5% GST (Goods and Services Tax in INR)
    this.tax = tax !== undefined ? Math.round(tax * 100) / 100 : Math.round(subtotalAfterDiscount * 0.05 * 100) / 100;

    // Final total rounded to 2 decimal places
    this.total = total !== undefined ? Math.round(total * 100) / 100 : Math.round((subtotalAfterDiscount + this.tax) * 100) / 100;

    // ENCAPSULATION: Freeze object at runtime to guarantee complete immutability
    Object.freeze(this);
  }

  public toJSON(): Record<string, unknown> {
    return {
      base: this.base,
      distanceCharge: this.distanceCharge,
      timeCharge: this.timeCharge,
      surgeMultiplier: this.surgeMultiplier,
      discount: this.discount,
      tax: this.tax,
      total: this.total,
      currency: this.currency
    };
  }
}

