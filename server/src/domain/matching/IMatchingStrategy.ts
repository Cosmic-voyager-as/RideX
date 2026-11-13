import { Driver } from '../Driver';
import { Location } from '../User';
import { VehicleCategory } from '../Vehicle';

export interface MatchRequest {
  rideId: string;
  pickup: Location;
  vehicleCategory: VehicleCategory;
}

/** OOP: Abstraction
 *  WHY: Strategy contract defining driver dispatch selection algorithms, allowing real-time switching between proximity, ratings, and balanced scoring without modifying dispatch callers. */
export interface IMatchingStrategy {
  /**
   * Returns strategy identifier name
   */
  getName(): string;

  /**
   * POLYMORPHISM: Ranks and returns matching drivers in descending preference order
   */
  findDriver(request: MatchRequest, availableDrivers: Driver[]): Driver[];
}

