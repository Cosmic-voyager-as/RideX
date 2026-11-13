import { IPricingStrategy } from './IPricingStrategy';
import { Vehicle } from '../Vehicle';
import { Fare } from './Fare';
import { ValidationError } from '../../errors';

/** OOP: Polymorphism, Abstraction
 *  WHY: Implements the baseline standard tariff computation conforming to the IPricingStrategy interface. */
export class StandardPricing implements IPricingStrategy {
  /**
   * POLYMORPHISM: Computes fare using the vehicle's polymorphic rate getters at 1.0x standard rate
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

    return new Fare(base, distanceCharge, timeCharge, 1.0, 0.0);
  }
}

