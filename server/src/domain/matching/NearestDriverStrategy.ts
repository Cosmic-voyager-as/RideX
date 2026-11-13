import { IMatchingStrategy, MatchRequest } from './IMatchingStrategy';
import { Driver } from '../Driver';
import { calculateHaversineDistance } from '../../utils/geo';

/** OOP: Polymorphism, Abstraction
 *  WHY: Concrete matching strategy prioritizing geographical proximity using the Haversine formula. */
export class NearestDriverStrategy implements IMatchingStrategy {
  public getName(): string {
    return 'NEAREST_DRIVER';
  }

  /**
   * POLYMORPHISM: Ranks drivers closest to pickup location first
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
      return distA - distB;
    });
  }
}

