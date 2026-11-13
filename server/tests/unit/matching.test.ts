import { describe, it, expect } from 'vitest';
import { NearestDriverStrategy } from '../../src/domain/matching/NearestDriverStrategy';
import { HighestRatedStrategy } from '../../src/domain/matching/HighestRatedStrategy';
import { BalancedStrategy } from '../../src/domain/matching/BalancedStrategy';
import { MatchRequest } from '../../src/domain/matching/IMatchingStrategy';
import { Driver } from '../../src/domain/Driver';
import { Sedan } from '../../src/domain/vehicles/Sedan';

describe('OOP Showcase: Driver Matching Strategies (Strategy Pattern & Polymorphism)', () => {
  const pickup = { latitude: 12.9716, longitude: 77.5946, address: 'MG Road' }; // Central location

  // Driver 1: Very close (0.5 km away), but 3.5 rating
  const driverCloseLowRating = new Driver(
    'drv-close',
    'Driver Close',
    'c@r.com',
    'h',
    '+910001',
    'DL-1',
    new Sedan('KA-01-A', 'City', 'White'),
    'ONLINE',
    { latitude: 12.975, longitude: 77.596 }, // ~0.5 km
    0,
    [3, 4, 3, 4] // ~3.5 rating
  );

  // Driver 2: Farther away (5.0 km away), but 5.0 perfect rating
  const driverFarHighRating = new Driver(
    'drv-far',
    'Driver Far High',
    'f@r.com',
    'h',
    '+910002',
    'DL-2',
    new Sedan('KA-02-B', 'Camry', 'Silver'),
    'ONLINE',
    { latitude: 12.935, longitude: 77.624 }, // ~5.1 km away
    0,
    [5, 5, 5, 5, 5] // 5.0 rating
  );

  const availableDrivers = [driverCloseLowRating, driverFarHighRating];
  const request: MatchRequest = {
    rideId: 'ride-req-1',
    pickup,
    vehicleCategory: 'SEDAN'
  };

  it('POLYMORPHISM: NearestDriverStrategy picks the closest driver first based on Haversine distance', () => {
    const strategy = new NearestDriverStrategy();
    const ranked = strategy.findDriver(request, availableDrivers);

    expect(ranked.length).toBe(2);
    expect(ranked[0].getId()).toBe('drv-close');
    expect(ranked[1].getId()).toBe('drv-far');
  });

  it('POLYMORPHISM: HighestRatedStrategy picks the highest rated driver first', () => {
    const strategy = new HighestRatedStrategy();
    const ranked = strategy.findDriver(request, availableDrivers);

    expect(ranked.length).toBe(2);
    expect(ranked[0].getId()).toBe('drv-far'); // 5.0 rating beats 3.5
    expect(ranked[1].getId()).toBe('drv-close');
  });

  it('POLYMORPHISM: BalancedStrategy calculates composite quality-distance score', () => {
    const strategy = new BalancedStrategy();
    const ranked = strategy.findDriver(request, availableDrivers);

    expect(ranked.length).toBe(2);
    // drv-close: (3.5 * 2) - 0.5 = 6.5
    // drv-far: (5.0 * 2) - 5.1 = 4.9
    // Close driver wins due to proximity weight
    expect(ranked[0].getId()).toBe('drv-close');
  });
});

