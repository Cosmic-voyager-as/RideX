import { describe, it, expect } from 'vitest';
import { PromoCode } from '../../src/domain/promo/PromoCode';
import { Customer } from '../../src/domain/Customer';
import { Wallet } from '../../src/domain/Wallet';
import { Fare } from '../../src/domain/pricing/Fare';
import { ValidationError } from '../../src/errors';

describe('OOP Showcase: PromoCode (Encapsulation)', () => {
  const createCustomer = (id: string = 'cust-10') => {
    return new Customer(
      id,
      'Neha Gupta',
      'neha@example.in',
      'pwd_hash',
      '+919876543299',
      new Wallet('w-10', id, 500)
    );
  };

  const sampleFare = new Fare(10.0, 50.0, 20.0, 1.0, 0.0); // Subtotal = 80.00, Tax = 4.00, Total = 84.00

  it('ENCAPSULATION: PromoCode encapsulates usage counter and increments only upon apply()', () => {
    const promo = new PromoCode(
      'p-1',
      'FESTIVE50',
      50, // 50% discount
      100.0, // max ₹100
      50.0, // min fare ₹50
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days future
      2 // max 2 redemptions
    );

    expect(promo.getUsageCount()).toBe(0);

    const discountedFare1 = promo.apply(sampleFare);
    // 50% of 80.00 = 40.00 discount
    // Subtotal after discount = 40.00
    // Tax = 2.00
    // Total = 42.00
    expect(discountedFare1.discount).toBe(40.0);
    expect(discountedFare1.total).toBe(42.0);

    // ENCAPSULATION: Usage count incremented internally
    expect(promo.getUsageCount()).toBe(1);

    // Second redemption
    promo.apply(sampleFare);
    expect(promo.getUsageCount()).toBe(2);

    // Third redemption exceeds maxUsage (2) -> throws ValidationError
    expect(() => promo.apply(sampleFare)).toThrowError(ValidationError);
  });

  it('ENCAPSULATION: isValidFor() rejects expired promo codes', () => {
    const expiredPromo = new PromoCode(
      'p-exp',
      'EXPIRED20',
      20,
      50.0,
      10.0,
      new Date(Date.now() - 1000) // Past date
    );

    expect(expiredPromo.isExpired()).toBe(true);
    expect(expiredPromo.isValidFor(createCustomer(), sampleFare)).toBe(false);
    expect(() => expiredPromo.apply(sampleFare)).toThrowError(ValidationError);
  });

  it('ENCAPSULATION: isValidFor() enforces minimum fare and customer targeting', () => {
    const highMinPromo = new PromoCode(
      'p-high',
      'LUXURY100',
      20,
      100.0,
      500.0 // Requires ₹500 min fare
    );

    const smallFare = new Fare(5.0, 10.0, 5.0, 1.0, 0.0); // Total ~21
    expect(highMinPromo.isValidFor(createCustomer(), smallFare)).toBe(false);

    // Targeted customer coupon
    const targetedPromo = new PromoCode(
      'p-target',
      'VIPONLY',
      30,
      150.0,
      0,
      new Date(Date.now() + 100000),
      10,
      0,
      true,
      ['cust-vip-1'] // Only cust-vip-1 allowed
    );

    const regularCustomer = createCustomer('cust-regular');
    const vipCustomer = createCustomer('cust-vip-1');

    expect(targetedPromo.isValidFor(regularCustomer, sampleFare)).toBe(false);
    expect(targetedPromo.isValidFor(vipCustomer, sampleFare)).toBe(true);
  });
});

