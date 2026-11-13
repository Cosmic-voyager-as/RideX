import { IPricingStrategy } from './IPricingStrategy';
import { Vehicle } from '../Vehicle';
import { Fare } from './Fare';
import { ValidationError } from '../../errors';

/** OOP: Polymorphism, Encapsulation
 *  WHY: Implements nocturnal tariff strategy applying an extra nocturnal surcharge during night hours (11 PM - 5 AM). */
export class NightPricing implements IPricingStrategy {
  // ENCAPSULATION: Night operating parameters and hour overrides are private
  private readonly _overrideHour?: number;
  private readonly _nightMultiplier: number;

  constructor(overrideHour?: number, nightMultiplier: number = 1.25) {
    if (overrideHour !== undefined && (overrideHour < 0 || overrideHour > 23)) {
      throw new ValidationError(`Hour must be between 0 and 23. Received: ${overrideHour}`);
    }
    if (nightMultiplier < 1.0) {
      throw new ValidationError('Night multiplier cannot be less than 1.0');
    }
    this._overrideHour = overrideHour;
    this._nightMultiplier = nightMultiplier;
  }

  /**
   * Evaluates whether the current or specified time falls within nocturnal window (23:00 - 05:00)
   */
  public isNightTime(): boolean {
    const hour = this._overrideHour !== undefined ? this._overrideHour : new Date().getHours();
    return hour >= 23 || hour < 5;
  }

  /**
   * POLYMORPHISM: Computes night-adjusted fare conforming to IPricingStrategy
   */
  public calculate(distanceKm: number, durationMin: number, vehicle: Vehicle): Fare {
    if (!vehicle) {
      throw new ValidationError('Vehicle is required to calculate fare');
    }
    if (distanceKm < 0 || durationMin < 0) {
      throw new ValidationError('Distance and duration cannot be negative');
    }

    const base = vehicle.getBaseFare();
    const distanceCharge = distanceKm * vehicle.getPerKmRate();
    const timeCharge = durationMin * vehicle.getPerMinuteRate();
    const multiplier = this.isNightTime() ? this._nightMultiplier : 1.0;

    return new Fare(base, distanceCharge, timeCharge, multiplier, 0.0);
  }
}

