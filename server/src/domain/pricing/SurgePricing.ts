import { IPricingStrategy } from './IPricingStrategy';
import { Vehicle } from '../Vehicle';
import { Fare } from './Fare';
import { ValidationError } from '../../errors';

export type DemandLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** OOP: Polymorphism, Encapsulation
 *  WHY: Encapsulates surge multipliers mapped from market demand levels to scale fare calculations dynamically. */
export class SurgePricing implements IPricingStrategy {
  // ENCAPSULATION: Multiplier is private and protected from tampering
  private readonly _multiplier: number;
  private readonly _demandLevel: string;

  constructor(demand: DemandLevel | number) {
    if (typeof demand === 'string') {
      this._demandLevel = demand;
      switch (demand) {
        case 'LOW':
          this._multiplier = 1.0;
          break;
        case 'MEDIUM':
          this._multiplier = 1.3;
          break;
        case 'HIGH':
          this._multiplier = 1.6;
          break;
        case 'CRITICAL':
          this._multiplier = 2.0;
          break;
        default:
          throw new ValidationError(`Unknown demand level: ${demand}`);
      }
    } else if (typeof demand === 'number') {
      if (isNaN(demand) || demand < 1.0) {
        throw new ValidationError('Surge multiplier must be at least 1.0');
      }
      this._multiplier = Math.round(demand * 100) / 100;
      this._demandLevel = `CUSTOM_${this._multiplier}X`;
    } else {
      throw new ValidationError('Demand level must be a valid level string or positive multiplier');
    }
  }

  // ENCAPSULATION: Read-only accessors
  public getMultiplier(): number {
    return this._multiplier;
  }

  public getDemandLevel(): string {
    return this._demandLevel;
  }

  /**
   * POLYMORPHISM: Computes surge-adjusted fare conforming to IPricingStrategy
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

    // Surge multiplier scales distance and time charges
    return new Fare(base, distanceCharge, timeCharge, this._multiplier, 0.0);
  }
}

