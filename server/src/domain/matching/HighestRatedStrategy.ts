import { IMatchingStrategy, MatchRequest } from './IMatchingStrategy';
import { Driver } from '../Driver';

/** OOP: Polymorphism, Abstraction
 *  WHY: Concrete matching strategy prioritizing customer satisfaction metrics by ranking top-rated drivers first. */
export class HighestRatedStrategy implements IMatchingStrategy {
  public getName(): string {
    return 'HIGHEST_RATED';
  }

  /**
   * POLYMORPHISM: Ranks drivers with highest average star ratings first
   */
  public findDriver(request: MatchRequest, availableDrivers: Driver[]): Driver[] {
    const eligible = availableDrivers.filter((driver) => {
      const loc = driver.getCurrentLocation();
      const vehicle = driver.getVehicle();
      if (!loc || !vehicle) return false;
      return vehicle.getVehicleType() === request.vehicleCategory;
    });

    return eligible.sort((a, b) => {
      const diff = b.getRatingAverage() - a.getRatingAverage();
      if (Math.abs(diff) > 0.01) return diff;
      return b.getRatingCount() - a.getRatingCount();
    });
  }
}

