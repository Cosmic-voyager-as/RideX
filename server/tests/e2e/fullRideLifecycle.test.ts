import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { UserRepository } from '../../src/repositories/UserRepository';
import { VehicleRepository } from '../../src/repositories/VehicleRepository';
import { RideRepository } from '../../src/repositories/RideRepository';
import { RatingRepository } from '../../src/repositories/RatingRepository';
import { PromoCodeRepository } from '../../src/repositories/PromoCodeRepository';
import { AuthService } from '../../src/services/AuthService';
import { RideService } from '../../src/services/RideService';
import { CustomerService } from '../../src/services/CustomerService';
import { DriverService } from '../../src/services/DriverService';
import { AdminService } from '../../src/services/AdminService';
import { Customer } from '../../src/domain/Customer';
import { Driver } from '../../src/domain/Driver';
import { ValidationError } from '../../src/errors';
import fs from 'fs';
import path from 'path';

describe('E2E Lifecycle: Full Ride-Hailing Multi-Role Journey & Invariant Verification', () => {
  // Setup isolated in-memory SQLite database
  const sqlite = new DatabaseSync(':memory:');
  const schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  sqlite.exec(schemaSql);

  const dbAdapter = {
    prepare: (sql: string) => {
      const stmt = sqlite.prepare(sql);
      return {
        run: (...params: any[]) => {
          const res = stmt.run(...params);
          return {
            changes: Number((res as any)?.changes ?? 1),
            lastInsertRowid: Number((res as any)?.lastInsertRowid ?? 0)
          };
        },
        get: (...params: any[]) => stmt.get(...params),
        all: (...params: any[]) => stmt.all(...params)
      };
    },
    exec: (sql: string) => {
      sqlite.exec(sql);
    }
  };

  // Instantiate Repositories
  const vehicleRepo = new VehicleRepository(dbAdapter);
  const ratingRepo = new RatingRepository(dbAdapter);
  const userRepo = new UserRepository(dbAdapter, undefined, vehicleRepo, ratingRepo);
  const rideRepo = new RideRepository(dbAdapter, userRepo, vehicleRepo);
  const promoRepo = new PromoCodeRepository(dbAdapter);

  // Instantiate Services
  const authService = new AuthService(userRepo);
  const rideService = new RideService(userRepo, rideRepo, vehicleRepo, ratingRepo, promoRepo);
  const customerService = new CustomerService(userRepo, promoRepo);
  const driverService = new DriverService(userRepo, rideRepo);
  const adminService = new AdminService(userRepo, rideRepo);

  it('EXECUTES COMPLETE RIDE LIFECYCLE: Booking -> OTP Verification -> Completion -> 80/20 Split -> Rating', async () => {
    // 1. Register Customer
    const customerAuth = authService.register({
      role: 'CUSTOMER',
      name: 'E2E Rider Maya',
      email: 'maya@ridex.com',
      password: 'Password@123',
      phone: '+919988771122'
    });
    expect(customerAuth.user.role).toBe('CUSTOMER');
    const customerId = customerAuth.user.id;

    // Credit Customer Wallet with ₹1,000
    const initialWallet = customerService.topUpWallet(customerId, 1000);
    expect(initialWallet.balance).toBe(1000);

    // 2. Register Driver with a Sedan
    const driverAuth = authService.register({
      role: 'DRIVER',
      name: 'E2E Driver Ramesh',
      email: 'ramesh@ridex.com',
      password: 'Password@123',
      phone: '+919988773344',
      vehicleType: 'SEDAN',
      plateNumber: 'KA-05-E2E-9999',
      model: 'Honda City E2E',
      color: 'Pearl White',
      licenseNumber: 'DL-KA-E2E-2024'
    });
    expect(driverAuth.user.role).toBe('DRIVER');
    const driverId = driverAuth.user.id;

    // Driver reports location first, then goes ONLINE (Encapsulation invariant)
    driverService.updateLocation(driverId, 12.975, 77.635, 'Indiranagar 100ft Rd');
    driverService.setStatus(driverId, 'ONLINE');

    // 3. Customer estimates fare for Sedan (6 km, 18 min)
    const estimate = rideService.estimateFare('SEDAN', 6, 18);
    expect(estimate.total).toBeGreaterThan(20);
    expect(estimate.tax).toBeGreaterThan(0); // 5% GST

    // 4. Customer books StandardRide with WALLET payment
    const bookedRide = rideService.bookRide({
      customerId,
      vehicleCategory: 'SEDAN',
      rideType: 'Standard',
      pickup: { latitude: 12.9784, longitude: 77.6408, address: 'Indiranagar' },
      dropoff: { latitude: 12.9352, longitude: 77.6245, address: 'Koramangala' },
      distanceKm: 6,
      durationMin: 18,
      paymentMethod: 'WALLET'
    });

    expect(bookedRide.getStatus()).toBe('REQUESTED');
    const rideId = bookedRide.getId();
    const customerOtp = bookedRide.getOtp();
    expect(customerOtp).toHaveLength(4);

    // 5. Driver accepts the ride
    const acceptedRide = driverService.acceptRide(driverId, rideId);
    expect(acceptedRide.getStatus()).toBe('ACCEPTED');

    const driverEntity = userRepo.findById(driverId) as Driver;
    expect(driverEntity.getStatus()).toBe('ON_TRIP');

    // 6. Driver arrives at pickup
    const arrivedRide = driverService.arriveAtPickup(driverId, rideId);
    expect(arrivedRide.getStatus()).toBe('ARRIVED');

    // 7. Security Invariant: Driver attempts start with INVALID OTP
    expect(() => {
      driverService.startTrip(driverId, rideId, '0000');
    }).toThrow(ValidationError);
    expect(arrivedRide.getStatus()).toBe('ARRIVED'); // State must remain ARRIVED

    // 8. Driver enters VALID 4-digit OTP
    const startedRide = driverService.startTrip(driverId, rideId, customerOtp);
    expect(startedRide.getStatus()).toBe('IN_PROGRESS');

    // 9. Driver completes the trip
    const completedRide = await driverService.completeTrip(driverId, rideId);
    expect(completedRide.getStatus()).toBe('COMPLETED');

    // 10. Financial & Encapsulation Invariants:
    // Customer Wallet must have been debited by the ride fare total
    const customerAfter = userRepo.findById(customerId) as Customer;
    const fareAmount = completedRide.getFare()!.total;
    expect(customerAfter.getWallet().getBalance()).toBe(1000 - fareAmount);

    // Driver earnings must reflect the 80% split
    const driverEarnings = driverService.getEarnings(driverId);
    expect(driverEarnings.earnings).toBeCloseTo(fareAmount * 0.8, 1);
    expect(driverEarnings.status).toBe('ONLINE'); // Driver returns safely to ONLINE

    // 11. Customer rates Driver with 5 stars
    const ratingResult = rideService.rateDriver(rideId, customerId, 5, 'Exceptional driving and courtesy!');
    expect(ratingResult.score).toBe(5);

    const refreshedDriver = userRepo.findById(driverId) as Driver;
    expect(refreshedDriver.getRatingAverage()).toBe(5);

    // 12. Admin Governance & Audits
    const analytics = adminService.getAnalytics();
    expect(analytics.summary.completedRides).toBe(1);
    expect(analytics.summary.totalRevenue).toBeGreaterThan(20);
  });
});
