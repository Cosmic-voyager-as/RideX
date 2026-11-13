import { Vehicle } from '../Vehicle';
import { Fare } from './Fare';

/** OOP: Abstraction
 *  WHY: Defines the Strategy interface for fare computation, allowing pricing algorithms to be swapped at runtime without changing the consuming FareCalculator. */
export interface IPricingStrategy {
  /**
   * POLYMORPHISM: Computes fare breakdown polymorphically based on distance, duration, and vehicle contract
   */
  calculate(distanceKm: number, durationMin: number, vehicle: Vehicle): Fare;
}

