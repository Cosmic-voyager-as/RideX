import { describe, it, expect } from 'vitest';
import { Ride } from '../../src/domain/rides/Ride';
import { StandardRide } from '../../src/domain/rides/StandardRide';
import { SharedRide } from '../../src/domain/rides/SharedRide';
import { ScheduledRide } from '../../src/domain/rides/ScheduledRide';
import { OutstationRide } from '../../src/domain/rides/OutstationRide';
import { Customer } from '../../src/domain/Customer';
import { Driver } from '../../src/domain/Driver';
import { Wallet } from '../../src/domain/Wallet';
import { Sedan } from '../../src/domain/vehicles/Sedan';
import { StandardPricing } from '../../src/domain/pricing/StandardPricing';
import { ValidationError } from '../../src/errors';

describe('OOP Showcase: Ride Hierarchy & State Machine (Encapsulation, Inheritance, Polymorphism)', () => {
  const vehicle = new Sedan('KA-01-MJ-5555', 'Honda City', 'White');
  const pricingStrategy = new StandardPricing();

  const createCustomer = () => {
    return new Customer(
      'cust-1',
      'Ananya Sen',
      'ananya@example.in',
      'hash_pwd',
      '+919876543211',
      new Wallet('w-1', 'cust-1', 1000)
    );
  };

  const createDriver = () => {
    const driver = new Driver(
      'drv-1',
      'Vikram Singh',
      'vikram@example.in',
      'hash_pwd',
      '+919876543222',
      'DL-KA-55555'
    );
    driver.assignVehicle(vehicle);
    driver.updateLocation(12.9716, 77.5946, 'MG Road, Bengaluru');
    driver.goOnline();
    return driver;
  };

  const pickup = { latitude: 12.9716, longitude: 77.5946, address: 'MG Road' };
  const dropoff = { latitude: 12.9352, longitude: 77.6245, address: 'Koramangala' };

  it('ABSTRACTION: Ride is abstract and cannot be instantiated directly', () => {
    // ABSTRACTION: Direct instantiation guarded at compile time and runtime
    // @ts-expect-error TS2511: Cannot create an instance of an abstract class.
    expect(() => new Ride('r-1', createCustomer(), vehicle, pickup, dropoff, 10, 20)).toThrow();
  });

  it('ENCAPSULATION: State Machine strictly enforces legal transitions: REQUESTED -> ACCEPTED -> ARRIVED -> IN_PROGRESS -> COMPLETED', () => {
    const customer = createCustomer();
    const driver = createDriver();
    const ride = new StandardRide('ride-1', customer, vehicle, pickup, dropoff, 10, 20);

    expect(ride.getStatus()).toBe('REQUESTED');

    // 1. Accept
    ride.accept(driver);
    expect(ride.getStatus()).toBe('ACCEPTED');
    expect(driver.getStatus()).toBe('ON_TRIP');

    // 2. Arrive
    ride.arrive();
    expect(ride.getStatus()).toBe('ARRIVED');

    // 3. Start
    ride.start();
    expect(ride.getStatus()).toBe('IN_PROGRESS');

    // 4. Complete
    ride.complete(pricingStrategy);
    expect(ride.getStatus()).toBe('COMPLETED');
    expect(ride.getCompletedAt()).toBeDefined();
    expect(ride.getFare()).toBeDefined();
  });

  it('ENCAPSULATION: State Machine rejects illegal state transitions with ValidationError', () => {
    const ride = new StandardRide('ride-2', createCustomer(), vehicle, pickup, dropoff, 10, 20);

    // Cannot jump directly from REQUESTED to IN_PROGRESS
    expect(() => ride.start()).toThrowError(ValidationError);

    // Cannot jump directly from REQUESTED to ARRIVED
    expect(() => ride.arrive()).toThrowError(ValidationError);

    // Accept ride properly
    ride.accept(createDriver());

    // Once accepted, cannot jump directly to COMPLETED without starting
    expect(() => ride.complete(pricingStrategy)).toThrowError(ValidationError);

    // Cancel ride
    ride.cancel('User plans changed');
    expect(ride.getStatus()).toBe('CANCELLED');

    // Terminal state: cannot transition from CANCELLED to anything
    expect(() => ride.accept(createDriver())).toThrowError(ValidationError);
  });

  it('POLYMORPHISM: StandardRide, SharedRide, ScheduledRide, OutstationRide calculate distinct fares and cancellation fees', () => {
    const customer = createCustomer();
    const distanceKm = 60; // 60 km supports outstation threshold
    const durationMin = 90;

    const standard = new StandardRide('r-std', customer, vehicle, pickup, dropoff, distanceKm, durationMin);
    const shared = new SharedRide('r-shd', customer, vehicle, pickup, dropoff, distanceKm, durationMin, 2);
    const scheduled = new ScheduledRide(
      'r-sch',
      customer,
      vehicle,
      pickup,
      dropoff,
      distanceKm,
      durationMin,
      new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours in future
    );
    const outstation = new OutstationRide('r-out', customer, vehicle, pickup, dropoff, distanceKm, durationMin);

    const fStandard = standard.calculateFare(pricingStrategy);
    const fShared = shared.calculateFare(pricingStrategy);
    const fScheduled = scheduled.calculateFare(pricingStrategy);
    const fOutstation = outstation.calculateFare(pricingStrategy);

    // Shared ride gives carpooling split discount -> lower than standard
    expect(fShared.total).toBeLessThan(fStandard.total);

    // Scheduled ride adds advance booking fee -> higher than standard
    expect(fScheduled.total).toBeGreaterThan(fStandard.total);

    // Outstation ride appends ₹500 driver allowance -> highest total
    expect(fOutstation.total).toBeGreaterThan(fScheduled.total);

    // Distinct cancellation policies
    standard.accept(createDriver());
    expect(standard.getCancellationFee()).toBe(50.0); // Standard ₹50 fee

    shared.accept(createDriver());
    expect(shared.getCancellationFee()).toBe(30.0); // Shared ₹30 fee

    outstation.accept(createDriver());
    expect(outstation.getCancellationFee()).toBe(250.0); // Outstation ₹250 fee
  });

  it('OutstationRide enforces minimum distance requirement (50 km)', () => {
    expect(
      () => new OutstationRide('r-out-err', createCustomer(), vehicle, pickup, dropoff, 25, 30)
    ).toThrowError(ValidationError);
  });
});

