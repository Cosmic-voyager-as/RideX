import { Ride, RideStatus } from './Ride';
import { Customer } from '../Customer';
import { Driver } from '../Driver';
import { Vehicle } from '../Vehicle';
import { Location } from '../User';
import { Fare } from '../pricing/Fare';
import { IPricingStrategy } from '../pricing/IPricingStrategy';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Ride for standard point-to-point urban transport with standard city cancellation fees. */
export class StandardRide extends Ride {
  constructor(
    id: string,
    customer: Customer,
    vehicle: Vehicle,
    pickupLocation: Location,
    dropoffLocation: Location,
    distanceKm: number,
    durationMin: number,
    driver: Driver | null = null,
    status: RideStatus = 'REQUESTED',
    createdAt: Date = new Date(),
    otp?: string,
    trackingToken?: string
  ) {
    super(id, customer, vehicle, pickupLocation, dropoffLocation, distanceKm, durationMin, driver, status, createdAt, otp, trackingToken);
  }

  public getRideType(): string {
    return 'STANDARD_RIDE';
  }

  /**
   * POLYMORPHISM: Calculates standard fare directly through the injected IPricingStrategy
   */
  public calculateFare(pricingStrategy: IPricingStrategy): Fare {
    return pricingStrategy.calculate(this._distanceKm, this._durationMin, this._vehicle);
  }

  /**
   * POLYMORPHISM: Computes cancellation fee based on current lifecycle stage
   */
  public getCancellationFee(): number {
    switch (this._status) {
      case 'REQUESTED':
        return 0.0;
      case 'ACCEPTED':
      case 'ARRIVED':
        return 50.0; // ₹50 cancellation fee once driver is dispatched
      case 'IN_PROGRESS':
        return 100.0; // ₹100 mid-trip cancellation fee
      default:
        return 0.0;
    }
  }
}
