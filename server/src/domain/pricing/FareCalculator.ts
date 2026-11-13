import { IPricingStrategy } from './IPricingStrategy';
import { Vehicle } from '../Vehicle';
import { Fare } from './Fare';
import { ValidationError } from '../../errors';

/** OOP: Abstraction, Polymorphism
 *  WHY: Implements dependency injection by depending entirely on the IPricingStrategy abstraction, remaining completely agnostic of concrete pricing algorithms. */
export class FareCalculator {
  // ABSTRACTION: Private reference depends on contract, not concrete implementation
  private _strategy: IPricingStrategy;

  constructor(strategy: IPricingStrategy) {
    if (!strategy) {
      throw new ValidationError('FareCalculator requires an IPricingStrategy instance');
    }
    this._strategy = strategy;
  }

  // ABSTRACTION & POLYMORPHISM: Swaps pricing strategy dynamically at runtime
  public setStrategy(strategy: IPricingStrategy): void {
    if (!strategy) {
      throw new ValidationError('Pricing strategy cannot be null or undefined');
    }
    this._strategy = strategy;
  }

  public getStrategy(): IPricingStrategy {
    return this._strategy;
  }

  /**
   * POLYMORPHISM: Executes fare calculation via strategy contract without any `if (strategy instanceof ...)` checks
   */
  public calculateFare(distanceKm: number, durationMin: number, vehicle: Vehicle): Fare {
    return this._strategy.calculate(distanceKm, durationMin, vehicle);
  }
}

