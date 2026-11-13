import { IMatchingStrategy, MatchRequest } from './IMatchingStrategy';
import { Driver } from '../Driver';
import { calculateHaversineDistance } from '../../utils/geo';

/** OOP: Polymorphism, Abstraction
 *  WHY: Concrete matching strategy balancing geographic distance against service quality ratings to optimize operational throughput. */
export class BalancedStrategy implements IMatchingStrategy {
  public getName(): string {
    return 'BALANCED';
  }

  /**
   * POLYMORPHISM: Ranks drivers using a composite quality-distance mathematical score: (Rating * 2) - Distance
   */
  public findDriver(request: MatchRequest, availableDrivers: Driver[]): Driver[] {
    const eligible = availableDrivers.filter((driver) => {
      const loc = driver.getCurrentLocation();
      const vehicle = driver.getVehicle();
      if (!loc || !vehicle) return false;
      return vehicle.getVehicleType() === request.vehicleCategory;
    });

    return eligible.sort((a, b) => {
      const distA = calculateHaversineDistance(a.getCurrentLocation()!, request.pickup);
      const distB = calculateHaversineDistance(b.getCurrentLocation()!, request.pickup);

      const scoreA = a.getRatingAverage() * 2.0 - distA;
      const scoreB = b.getRatingAverage() * 2.0 - distB;

      return scoreB - scoreA;
    });
  }
}

