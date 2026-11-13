import { Ride, RideStatus } from './Ride';
import { Customer } from '../Customer';
import { Driver } from '../Driver';
import { Vehicle } from '../Vehicle';
import { Location } from '../User';
import { Fare } from '../pricing/Fare';
import { IPricingStrategy } from '../pricing/IPricingStrategy';
import { ValidationError } from '../../errors';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Ride for advance booked rides with future pickup schedules, advance booking fees, and schedule-proximity cancellation penalties. */
export class ScheduledRide extends Ride {
  // ENCAPSULATION: Scheduled pickup timestamp is private
  private readonly _scheduledPickupTime: Date;

  constructor(
    id: string,
    customer: Customer,
    vehicle: Vehicle,
    pickupLocation: Location,
    dropoffLocation: Location,
    distanceKm: number,
    durationMin: number,
    scheduledPickupTime: Date,
    driver: Driver | null = null,
    status: RideStatus = 'REQUESTED',
    createdAt: Date = new Date(),
    otp?: string,
    trackingToken?: string
  ) {
    super(id, customer, vehicle, pickupLocation, dropoffLocation, distanceKm, durationMin, driver, status, createdAt, otp, trackingToken);

    if (!scheduledPickupTime || isNaN(scheduledPickupTime.getTime())) {
      throw new ValidationError('Valid scheduled pickup time is required');
    }
    this._scheduledPickupTime = new Date(scheduledPickupTime.getTime());
  }

  public getRideType(): string {
    return 'SCHEDULED_RIDE';
  }

  public getScheduledPickupTime(): Date {
    return new Date(this._scheduledPickupTime.getTime());
  }

  /**
   * POLYMORPHISM: Appends a ₹40 advance reservation dispatch fee to the base fare
   */
  public calculateFare(pricingStrategy: IPricingStrategy): Fare {
    const rawFare = pricingStrategy.calculate(this._distanceKm, this._durationMin, this._vehicle);
    const reservationFee = 40.0;
    const updatedBase = rawFare.base + reservationFee;
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
   * POLYMORPHISM: Cancellation fee increases if cancelled close to pickup time
   */
  public getCancellationFee(): number {
    const hoursUntilPickup = (this._scheduledPickupTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilPickup > 2) {
      return 0.0; // Free cancellation > 2 hours in advance
    }
    if (this._status === 'ACCEPTED' || this._status === 'ARRIVED') {
      return 75.0; // ₹75 late scheduled cancellation
    }
    return 40.0; // Standard scheduled reservation retention fee
  }
}
