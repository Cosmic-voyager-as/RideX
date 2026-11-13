import { describe, it, expect } from 'vitest';
import { Fare } from '../../src/domain/pricing/Fare';
import { FareCalculator } from '../../src/domain/pricing/FareCalculator';
import { StandardPricing } from '../../src/domain/pricing/StandardPricing';
import { SurgePricing } from '../../src/domain/pricing/SurgePricing';
import { NightPricing } from '../../src/domain/pricing/NightPricing';
import { PromoPricing } from '../../src/domain/pricing/PromoPricing';
import { Sedan } from '../../src/domain/vehicles/Sedan';
import { Bike } from '../../src/domain/vehicles/Bike';
import { ValidationError } from '../../src/errors';

describe('OOP Showcase: Pricing & Strategy Pattern (Abstraction & Polymorphism)', () => {
  const sedan = new Sedan('DL-01-AB-1234', 'Honda City', 'White');
  const bike = new Bike('DL-01-BK-9999', 'Yamaha FZ', 'Black');
  const distanceKm = 10;
  const durationMin = 20;

  it('ENCAPSULATION: Fare is an immutable value object with 5% GST tax and readonly fields', () => {
    // Base: 7.00, Dist: 18.00 (10 * 1.80), Time: 7.00 (20 * 0.35) -> Subtotal = 32.00
    // Tax = 5% of 32.00 = 1.60 -> Total = 33.60
    const fare = new Fare(7.0, 18.0, 7.0, 1.0, 0.0);

    expect(fare.base).toBe(7.0);
    expect(fare.distanceCharge).toBe(18.0);
    expect(fare.timeCharge).toBe(7.0);
    expect(fare.surgeMultiplier).toBe(1.0);
    expect(fare.discount).toBe(0.0);
    expect(fare.tax).toBe(1.6);
    expect(fare.total).toBe(33.6);
    expect(fare.currency).toBe('INR');

    // Immutability verified: attempting to mutate properties in runtime throws or fails
    expect(() => {
      // @ts-expect-error Attempting mutation on readonly property
      fare.total = 100.0;
    }).toThrow();
  });

  it('POLYMORPHISM & ABSTRACTION: FareCalculator receives IPricingStrategy via DI and never checks concrete class', () => {
    const standardStrategy = new StandardPricing();
    const calculator = new FareCalculator(standardStrategy);

    // Sedan standard fare:
    // Base: 7.00, Dist: 10 * 1.80 = 18.00, Time: 20 * 0.35 = 7.00
    // Subtotal = 32.00, Tax (5%) = 1.60, Total = 33.60
    const fare = calculator.calculateFare(distanceKm, durationMin, sedan);
    expect(fare.total).toBe(33.6);
  });

  it('POLYMORPHISM: swapping pricing strategy at runtime changes the fare with NO code change in FareCalculator', () => {
    const standardStrategy = new StandardPricing();
    const surgeStrategy = new SurgePricing('HIGH'); // 1.6x multiplier
    const calculator = new FareCalculator(standardStrategy);

    // 1. Initial calculation with StandardPricing
    const standardFare = calculator.calculateFare(distanceKm, durationMin, sedan);
    expect(standardFare.total).toBe(33.6);

    // 2. Dynamically swap strategy at runtime
    calculator.setStrategy(surgeStrategy);

    // 3. Exact same method call produces different surge-adjusted fare
    // Distance + Time = (18 + 7) * 1.6 = 40.00
    // Subtotal = 7 (base) + 40 = 47.00
    // Tax (5%) = 2.35
    // Total = 49.35
    const surgeFare = calculator.calculateFare(distanceKm, durationMin, sedan);
    expect(surgeFare.surgeMultiplier).toBe(1.6);
    expect(surgeFare.total).toBe(49.35);

    // Proves fare changed dynamically without touching FareCalculator implementation
    expect(surgeFare.total).toBeGreaterThan(standardFare.total);
  });

  it('POLYMORPHISM: NightPricing applies nocturnal surcharge between 11 PM and 5 AM', () => {
    // 2 AM (Nocturnal window: hour 2)
    const nightStrategy = new NightPricing(2, 1.25);
    const dayStrategy = new NightPricing(14, 1.25); // 2 PM (Daytime)

    const nightFare = nightStrategy.calculate(distanceKm, durationMin, sedan);
    const dayFare = dayStrategy.calculate(distanceKm, durationMin, sedan);

    expect(nightStrategy.isNightTime()).toBe(true);
    expect(dayStrategy.isNightTime()).toBe(false);

    expect(nightFare.surgeMultiplier).toBe(1.25);
    expect(dayFare.surgeMultiplier).toBe(1.0);
    expect(nightFare.total).toBeGreaterThan(dayFare.total);
  });

  it('POLYMORPHISM & DECORATOR PATTERN: PromoPricing decorates another strategy and applies discounts', () => {
    const baseStrategy = new StandardPricing();
    // 20% discount decorator capped at ₹10
    const promoStrategy = new PromoPricing(baseStrategy, 20, 10.0);

    const calculator = new FareCalculator(promoStrategy);
    const fare = calculator.calculateFare(distanceKm, durationMin, sedan);

    // Raw subtotal = 32.00
    // 20% of 32.00 = 6.40 (under the ₹10 cap)
    // Discount = 6.40
    // Subtotal after discount = 32.00 - 6.40 = 25.60
    // 5% Tax = 1.28
    // Total = 26.88
    expect(fare.discount).toBe(6.4);
    expect(fare.tax).toBe(1.28);
    expect(fare.total).toBe(26.88);
  });

  it('SurgePricing supports demand levels (LOW, MEDIUM, HIGH, CRITICAL)', () => {
    const low = new SurgePricing('LOW');
    const med = new SurgePricing('MEDIUM');
    const high = new SurgePricing('HIGH');
    const crit = new SurgePricing('CRITICAL');

    expect(low.getMultiplier()).toBe(1.0);
    expect(med.getMultiplier()).toBe(1.3);
    expect(high.getMultiplier()).toBe(1.6);
    expect(crit.getMultiplier()).toBe(2.0);

    const f1 = low.calculate(distanceKm, durationMin, bike).total;
    const f2 = med.calculate(distanceKm, durationMin, bike).total;
    const f3 = high.calculate(distanceKm, durationMin, bike).total;
    const f4 = crit.calculate(distanceKm, durationMin, bike).total;

    expect(f1).toBeLessThan(f2);
    expect(f2).toBeLessThan(f3);
    expect(f3).toBeLessThan(f4);
  });
});

