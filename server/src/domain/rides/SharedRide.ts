import { Ride, RideStatus } from './Ride';
import { Customer } from '../Customer';
import { Driver } from '../Driver';
import { Vehicle } from '../Vehicle';
import { Location } from '../User';
import { Fare } from '../pricing/Fare';
import { IPricingStrategy } from '../pricing/IPricingStrategy';
import { ValidationError } from '../../errors';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Ride for shared carpooling trips, splitting fare components across multiple passengers and enforcing split cancellation rates. */
export class SharedRide extends Ride {
  // ENCAPSULATION: Passenger split count is private
  private readonly _passengerCount: number;

  constructor(
    id: string,
    customer: Customer,
    vehicle: Vehicle,
    pickupLocation: Location,
    dropoffLocation: Location,
    distanceKm: number,
    durationMin: number,
    passengerCount: number = 2,
    driver: Driver | null = null,
    status: RideStatus = 'REQUESTED',
    createdAt: Date = new Date(),
    otp?: string,
    trackingToken?: string
  ) {
    super(id, customer, vehicle, pickupLocation, dropoffLocation, distanceKm, durationMin, driver, status, createdAt, otp, trackingToken);

    if (passengerCount < 2) {
      throw new ValidationError('Shared rides require at least 2 passengers for fare splitting');
    }
    if (passengerCount > vehicle.getSeatingCapacity()) {
      throw new ValidationError(
        `Passenger count (${passengerCount}) exceeds vehicle seating capacity (${vehicle.getSeatingCapacity()})`
      );
    }
    this._passengerCount = passengerCount;
  }

  public getRideType(): string {
    return 'SHARED_RIDE';
  }

  public getPassengerCount(): number {
    return this._passengerCount;
  }

  /**
   * POLYMORPHISM: Splits individual fare by passenger count with a 15% carpool discount incentive
   */
  public calculateFare(pricingStrategy: IPricingStrategy): Fare {
    const rawFare = pricingStrategy.calculate(this._distanceKm, this._durationMin, this._vehicle);
    const carpoolDiscount = Number((rawFare.total * 0.15).toFixed(2));
    const splitTotal = Number(((rawFare.total - carpoolDiscount) / this._passengerCount).toFixed(2));

    return new Fare(
      Number((rawFare.base / this._passengerCount).toFixed(2)),
      Number((rawFare.distanceCharge / this._passengerCount).toFixed(2)),
      Number((rawFare.timeCharge / this._passengerCount).toFixed(2)),
      rawFare.surgeMultiplier,
      carpoolDiscount,
      Number((rawFare.tax / this._passengerCount).toFixed(2)),
      splitTotal
    );
  }

  /**
   * POLYMORPHISM: Split cancellation fee across riders
   */
  public getCancellationFee(): number {
    switch (this._status) {
      case 'ACCEPTED':
      case 'ARRIVED':
        return 30.0; // ₹30 per rider in shared mode
      case 'IN_PROGRESS':
        return 60.0;
      default:
        return 0.0;
    }
  }
}
