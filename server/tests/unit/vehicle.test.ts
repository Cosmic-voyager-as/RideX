import { describe, it, expect } from 'vitest';
import { Vehicle } from '../../src/domain/Vehicle';
import { Bike } from '../../src/domain/vehicles/Bike';
import { Auto } from '../../src/domain/vehicles/Auto';
import { MiniCar } from '../../src/domain/vehicles/MiniCar';
import { Sedan } from '../../src/domain/vehicles/Sedan';
import { SUV } from '../../src/domain/vehicles/SUV';
import { PremiumCar } from '../../src/domain/vehicles/PremiumCar';
import { ValidationError } from '../../src/errors';

describe('OOP Showcase: Vehicle Hierarchy (Polymorphism & Inheritance)', () => {
  it('ABSTRACTION: Vehicle is abstract and cannot be directly instantiated', () => {
    // ABSTRACTION: Direct instantiation prevented by TypeScript compiler
    // @ts-expect-error TS2511: Cannot create an instance of an abstract class.
    expect(() => new Vehicle('PLT-001', 'Generic', 'Black', 4)).toThrow();
  });

  it('POLYMORPHISM: each Vehicle subclass returns a distinct fare through the exact same calculateFare() method call', () => {
    // POLYMORPHISM: Heterogeneous collection of vehicles sharing the abstract Vehicle contract
    const fleet: Vehicle[] = [
      new Bike('BK-01', 'Yamaha FZ', 'Matte Black'),
      new Auto('AT-01', 'Bajaj Compact', 'Yellow-Green'),
      new MiniCar('MN-01', 'Maruti Swift', 'White'),
      new Sedan('SD-01', 'Honda City', 'Silver'),
      new SUV('SV-01', 'Toyota Fortuner', 'Dark Grey'),
      new PremiumCar('PR-01', 'Mercedes E-Class', 'Obsidian Black')
    ];

    const distanceKm = 10;
    const durationMinutes = 20;

    // NO `if (vehicle instanceof ...)` or `switch (vehicle.type)`!
    // The exact same method call behaves differently per subclass at runtime.
    const fares = fleet.map((vehicle) => vehicle.calculateFare(distanceKm, durationMinutes));

    // Verify expected calculated fares:
    // Bike: 2.50 + (10 * 0.80) + (20 * 0.15) = 13.50
    // Auto: 3.50 + (10 * 1.10) + (20 * 0.20) = 18.50
    // MiniCar: 5.00 + (10 * 1.40) + (20 * 0.25) = 24.00
    // Sedan: 7.00 + (10 * 1.80) + (20 * 0.35) = 32.00
    // SUV: 10.00 + (10 * 2.40) + (20 * 0.45) = 43.00
    // PremiumCar: 15.00 + (10 * 3.20) + (20 * 0.60) = 59.00
    expect(fares).toEqual([13.5, 18.5, 24.0, 32.0, 43.0, 59.0]);

    // Proves every fare in the fleet is strictly unique
    const uniqueFares = new Set(fares);
    expect(uniqueFares.size).toBe(fleet.length);

    // Proves fares escalate strictly with luxury/capacity tier
    for (let i = 0; i < fares.length - 1; i++) {
      expect(fares[i]).toBeLessThan(fares[i + 1]);
    }
  });

  it('POLYMORPHISM & TEMPLATE METHOD: describe() formats output polymorphically, and PremiumCar adds "Premium service"', () => {
    const sedan = new Sedan('NY-SD-10', 'Toyota Camry', 'White');
    const premium = new PremiumCar('NY-PR-99', 'BMW 7 Series', 'Black');

    const sedanDescription = sedan.describe();
    const premiumDescription = premium.describe();

    // Standard vehicle description via template method
    expect(sedanDescription).toContain('SEDAN: White Toyota Camry');
    expect(sedanDescription).toContain('Seats: 4');
    expect(sedanDescription).not.toContain('Premium service');

    // PremiumCar specializes describe() via polymorphism
    expect(premiumDescription).toContain('PREMIUM: Black BMW 7 Series');
    expect(premiumDescription).toContain('Premium service');
  });

  it('INHERITANCE: all subclasses enforce seating capacity invariants', () => {
    const bike = new Bike('B-1', 'Honda CB', 'Red');
    const auto = new Auto('A-1', 'Bajaj RE', 'Yellow');
    const mini = new MiniCar('M-1', 'Hyundai i10', 'Blue');
    const sedan = new Sedan('S-1', 'Honda Civic', 'Silver');
    const suv = new SUV('U-1', 'Ford Explorer', 'Black');
    const premium = new PremiumCar('P-1', 'Audi A8', 'Navy', 4);

    expect(bike.getSeatingCapacity()).toBe(1);
    expect(auto.getSeatingCapacity()).toBe(3);
    expect(mini.getSeatingCapacity()).toBe(4);
    expect(sedan.getSeatingCapacity()).toBe(4);
    expect(suv.getSeatingCapacity()).toBe(6);
    expect(premium.getSeatingCapacity()).toBe(4);
  });

  it('ENCAPSULATION: calculateFare() throws ValidationError on negative distance or duration', () => {
    const sedan = new Sedan('SD-02', 'Camry', 'Silver');

    expect(() => sedan.calculateFare(-5, 10)).toThrowError(ValidationError);
    expect(() => sedan.calculateFare(5, -10)).toThrowError(ValidationError);
  });
});

