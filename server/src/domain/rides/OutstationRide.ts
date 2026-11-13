import { Ride, RideStatus } from './Ride';
import { Customer } from '../Customer';
import { Driver } from '../Driver';
import { Vehicle } from '../Vehicle';
import { Location } from '../User';
import { Fare } from '../pricing/Fare';
import { IPricingStrategy } from '../pricing/IPricingStrategy';
import { ValidationError } from '../../errors';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Ride for long-distance intercity outstation journeys, enforcing minimum distance thresholds, driver daily allowances, and higher cancellation fees. */
export class OutstationRide extends Ride {
  // ENCAPSULATION: Intercity allowance parameters are private
  private readonly _driverAllowance: number = 500.0; // ₹500 driver daily meal & toll allowance
  private static readonly MIN_OUTSTATION_DISTANCE_KM = 50.0;

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

    if (distanceKm < OutstationRide.MIN_OUTSTATION_DISTANCE_KM) {
      throw new ValidationError(
        `Outstation rides require a minimum distance of ${OutstationRide.MIN_OUTSTATION_DISTANCE_KM} km. Received: ${distanceKm} km`
      );
    }
  }

  public getRideType(): string {
    return 'OUTSTATION_RIDE';
  }

  public getDriverAllowance(): number {
    return this._driverAllowance;
  }

  /**
   * POLYMORPHISM: Appends ₹500 driver daily allowance to base fare
   */
  public calculateFare(pricingStrategy: IPricingStrategy): Fare {
    const rawFare = pricingStrategy.calculate(this._distanceKm, this._durationMin, this._vehicle);
    const updatedBase = rawFare.base + this._driverAllowance;
    const subtotal = updatedBase + rawFare.distanceCharge + rawFare.timeCharge - rawFare.discount;
    const tax = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    return new Fare(
      updatedBase,
      rawFare.distanceCharge,
      rawFare.timeCharge,
      rawFare.surgeMultiplier,
      rawFare.discount,
      tax,
      total
    );
  }

  /**
   * POLYMORPHISM: Higher fixed cancellation fee due to intercity dispatch costs
   */
  public getCancellationFee(): number {
    switch (this._status) {
      case 'ACCEPTED':
      case 'ARRIVED':
        return 250.0; // ₹250 for driver outstation mobilization
      case 'IN_PROGRESS':
        return 500.0;
      default:
        return 0.0;
    }
  }
}
