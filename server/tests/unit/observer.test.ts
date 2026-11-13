import { describe, it, expect } from 'vitest';
import { StandardRide } from '../../src/domain/rides/StandardRide';
import { EarningsTrackerObserver } from '../../src/domain/observers/EarningsTrackerObserver';
import { NotificationServiceObserver } from '../../src/domain/observers/NotificationServiceObserver';
import { Customer } from '../../src/domain/Customer';
import { Driver } from '../../src/domain/Driver';
import { Wallet } from '../../src/domain/Wallet';
import { Sedan } from '../../src/domain/vehicles/Sedan';
import { StandardPricing } from '../../src/domain/pricing/StandardPricing';
import { ValidationError } from '../../src/errors';

describe('OOP Showcase: Ride Observers & OTP Verification (Observer Pattern & Encapsulation)', () => {
  const customer = new Customer('c-obs', 'Rider', 'r@o.com', 'h', '+919876500001', new Wallet('w-1', 'c-obs', 500));
  const vehicle = new Sedan('KA-01-OBS', 'Honda City', 'White');
  const driver = new Driver('d-obs', 'Driver', 'd@o.com', 'h', '+919876500002', 'DL-OBS-1', vehicle, 'ONLINE', {
    latitude: 12.97,
    longitude: 77.59
  });

  const pickup = { latitude: 12.9716, longitude: 77.5946 };
  const dropoff = { latitude: 12.9352, longitude: 77.6245 };

  it('OBSERVER PATTERN: Observers receive notifications on state machine transitions', () => {
    const ride = new StandardRide('ride-obs-1', customer, vehicle, pickup, dropoff, 10, 20);
    const notifObserver = new NotificationServiceObserver();
    const earningsObserver = new EarningsTrackerObserver();

    ride.addObserver(notifObserver);
    ride.addObserver(earningsObserver);

    // 1. Accept
    ride.accept(driver);
    expect(notifObserver.getLogs().length).toBe(1);
    expect(notifObserver.getLogs()[0].message).toContain('REQUESTED to ACCEPTED');

    // 2. Arrive
    ride.arrive();
    expect(notifObserver.getLogs().length).toBe(2);

    // 3. Start
    ride.start();
    expect(notifObserver.getLogs().length).toBe(3);

    // 4. Complete -> triggers 80/20 earnings split calculation
    ride.complete(new StandardPricing());
    expect(notifObserver.getLogs().length).toBe(4);

    // Platform fee calculation: 20% of total fare (subtotal ₹32 + 5% GST ₹1.60 = ₹33.60 -> 20% is ₹6.72)
    expect(earningsObserver.getPlatformFees()).toBe(6.72);
  });

  it('SECURITY & ENCAPSULATION: startWithOtp requires the exact 4-digit code and rejects mismatches', () => {
    const ride = new StandardRide('ride-otp-1', customer, vehicle, pickup, dropoff, 10, 20);
    ride.accept(driver);
    ride.arrive();

    // Verification code is a 4-digit numeric string
    const validOtp = ride.getOtp();
    expect(validOtp).toMatch(/^\d{4}$/);

    // Wrong OTP throws ValidationError
    expect(() => ride.startWithOtp('0000')).toThrowError(ValidationError);

    // Correct OTP transitions trip to IN_PROGRESS
    ride.startWithOtp(validOtp);
    expect(ride.getStatus()).toBe('IN_PROGRESS');
  });

  it('public tracking token is generated for trip sharing', () => {
    const ride = new StandardRide('ride-track-1', customer, vehicle, pickup, dropoff, 10, 20);
    expect(ride.getTrackingToken()).toBeDefined();
    expect(ride.getTrackingToken()).toContain('track-');
  });
});
