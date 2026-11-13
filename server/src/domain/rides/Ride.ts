import { Customer } from '../Customer';
import { Driver } from '../Driver';
import { Vehicle } from '../Vehicle';
import { Location } from '../User';
import { Fare } from '../pricing/Fare';
import { IPricingStrategy } from '../pricing/IPricingStrategy';
import { IRideObserver } from '../observers/IRideObserver';
import { ValidationError } from '../../errors';

export type RideStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/** OOP: Abstraction, Inheritance, Encapsulation
 *  WHY: Models abstract ride lifecycle state machine, strictly encapsulating valid state transitions and enforcing polymorphic fare and cancellation fee contracts. */
export abstract class Ride {
  // ENCAPSULATION: All internal ride state variables are protected
  protected readonly _id: string;
  protected readonly _customer: Customer;
  protected _driver: Driver | null;
  protected readonly _vehicle: Vehicle;
  protected readonly _pickupLocation: Location;
  protected readonly _dropoffLocation: Location;
  protected readonly _distanceKm: number;
  protected readonly _durationMin: number;
  protected _status: RideStatus;
  protected _fare: Fare | null;
  protected readonly _createdAt: Date;
  protected _completedAt: Date | null;
  protected _cancellationReason: string | null;
  // ENCAPSULATION: 4-digit verification OTP and public tracking token
  protected readonly _otp: string;
  protected readonly _trackingToken: string;
  protected _paymentMethodName: string = 'WALLET';
  // OBSERVER PATTERN: List of subscribed observers
  private readonly _observers: IRideObserver[] = [];

  // ENCAPSULATION: Finite State Machine transition matrix
  private static readonly LEGAL_TRANSITIONS: Record<RideStatus, readonly RideStatus[]> = {
    REQUESTED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['ARRIVED', 'CANCELLED'],
    ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], // Terminal state
    CANCELLED: []  // Terminal state
  };

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
    if (new.target === Ride) {
      throw new Error('Cannot instantiate abstract class Ride directly');
    }
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Ride ID is required');
    }
    if (!customer) {
      throw new ValidationError('Customer is required for a ride');
    }
    if (!vehicle) {
      throw new ValidationError('Vehicle specification is required for a ride');
    }
    if (distanceKm <= 0) {
      throw new ValidationError(`Distance must be greater than zero. Received: ${distanceKm}`);
    }
    if (durationMin < 0) {
      throw new ValidationError('Duration cannot be negative');
    }

    this._id = id;
    this._customer = customer;
    this._vehicle = vehicle;
    this._pickupLocation = pickupLocation;
    this._dropoffLocation = dropoffLocation;
    this._distanceKm = distanceKm;
    this._durationMin = durationMin;
    this._driver = driver;
    this._status = status;
    this._fare = null;
    this._createdAt = createdAt;
    this._completedAt = null;
    this._cancellationReason = null;
    // Generate deterministic 4-digit numeric OTP for trip start verification
    this._otp = otp && otp.trim().length === 4 ? otp.trim() : Math.floor(1000 + Math.random() * 9000).toString();
    this._trackingToken = trackingToken || `track-${Math.random().toString(36).substring(2, 10)}`;
  }

  // ENCAPSULATION: Read-only accessors
  public getId(): string {
    return this._id;
  }

  public getCustomer(): Customer {
    return this._customer;
  }

  public getDriver(): Driver | null {
    return this._driver;
  }

  public getVehicle(): Vehicle {
    return this._vehicle;
  }

  public getPickupLocation(): Location {
    return { ...this._pickupLocation };
  }

  public getDropoffLocation(): Location {
    return { ...this._dropoffLocation };
  }

  public getDistanceKm(): number {
    return this._distanceKm;
  }

  public getDurationMin(): number {
    return this._durationMin;
  }

  public getStatus(): RideStatus {
    return this._status;
  }

  public getFare(): Fare | null {
    return this._fare;
  }

  public setFare(fare: Fare): void {
    this._fare = fare;
  }

  public getCreatedAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  public getCompletedAt(): Date | null {
    return this._completedAt ? new Date(this._completedAt.getTime()) : null;
  }

  // ENCAPSULATION: Getters for security OTP and public tracking token
  public getOtp(): string {
    return this._otp;
  }

  public getTrackingToken(): string {
    return this._trackingToken;
  }

  public getPaymentMethodName(): string {
    return this._paymentMethodName;
  }

  public setPaymentMethodName(method: string): void {
    if (method && method.trim().length > 0) {
      this._paymentMethodName = method.trim().toUpperCase();
    }
  }

  // OBSERVER PATTERN: Observer subscription management
  public addObserver(observer: IRideObserver): void {
    if (observer && !this._observers.some((o) => o.getObserverName() === observer.getObserverName())) {
      this._observers.push(observer);
    }
  }

  public removeObserver(observerName: string): void {
    const idx = this._observers.findIndex((o) => o.getObserverName() === observerName);
    if (idx !== -1) {
      this._observers.splice(idx, 1);
    }
  }

  protected notifyObservers(oldStatus: RideStatus, newStatus: RideStatus): void {
    for (const observer of this._observers) {
      try {
        observer.onRideStatusChanged(this, oldStatus, newStatus);
      } catch (err) {
        console.error(`[Observer Error] ${observer.getObserverName()}:`, err);
      }
    }
  }

  /**
   * ENCAPSULATION: Protected state transition method enforcing Finite State Machine invariants
   */
  protected setState(newState: RideStatus): void {
    const allowedNextStates = Ride.LEGAL_TRANSITIONS[this._status];

    if (!allowedNextStates.includes(newState)) {
      throw new ValidationError(
        `Illegal ride state transition: cannot transition from '${this._status}' to '${newState}'. Allowed next states: [${allowedNextStates.join(', ')}]`
      );
    }

    const oldStatus = this._status;
    this._status = newState;

    // OBSERVER PATTERN: Publishes state transition event to all subscribers
    this.notifyObservers(oldStatus, newState);
  }

  /**
   * Lifecycle event: Driver accepts ride dispatch
   */
  public accept(driver: Driver): void {
    if (!driver) {
      throw new ValidationError('Driver is required to accept ride');
    }
    this.setState('ACCEPTED');
    this._driver = driver;
    driver.acceptRide(this._id);
  }

  /**
   * Lifecycle event: Driver arrives at rider pickup location
   */
  public arrive(): void {
    this.setState('ARRIVED');
  }

  /**
   * Lifecycle event: Trip begins
   */
  public start(): void {
    this.setState('IN_PROGRESS');
  }

  /**
   * SECURITY & VALIDATION: Driver must submit the customer's 4-digit OTP to start the trip
   */
  public startWithOtp(inputOtp: string): void {
    if (!inputOtp || inputOtp.trim() !== this._otp) {
      throw new ValidationError(
        `Invalid ride start OTP '${inputOtp}'. Please ask the passenger for their 4-digit verification code.`
      );
    }
    this.start();
  }

  /**
   * Lifecycle event: Trip concludes and fare is finalized
   */
  public complete(pricingStrategy: IPricingStrategy): void {
    if (!pricingStrategy) {
      throw new ValidationError('Pricing strategy is required to finalize ride fare');
    }
    // Calculate final fare polymorphically
    this._fare = this.calculateFare(pricingStrategy);
    this.setState('COMPLETED');
    this._completedAt = new Date();

    if (this._driver && this._driver.getStatus() === 'ON_TRIP') {
      const driverShare = Math.round(this._fare.total * 0.8 * 100) / 100;
      this._driver.completeTrip(driverShare);
    }
  }

  /**
   * Lifecycle event: Trip cancelled
   */
  public cancel(reason: string = 'User cancellation'): number {
    this.setState('CANCELLED');
    this._cancellationReason = reason;

    if (this._driver) {
      this._driver.releaseFromTrip();
    }

    return this.getCancellationFee();
  }

  // ABSTRACTION & POLYMORPHISM: Abstract contracts specialized by concrete ride categories
  public abstract calculateFare(pricingStrategy: IPricingStrategy): Fare;
  public abstract getCancellationFee(): number;
  public abstract getRideType(): string;

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      rideType: this.getRideType(),
      customerId: this._customer.getId(),
      customerName: this._customer.getName(),
      driverId: this._driver ? this._driver.getId() : null,
      driverName: this._driver ? this._driver.getName() : null,
      driverPhone: this._driver ? this._driver.getPhone() : null,
      vehicle: this._driver?.getVehicle() ? this._driver.getVehicle()!.toJSON() : this._vehicle.toJSON(),
      pickupLocation: this.getPickupLocation(),
      dropoffLocation: this.getDropoffLocation(),
      status: this._status,
      otp: this._otp,
      trackingToken: this._trackingToken,
      distanceKm: this._distanceKm,
      durationMin: this._durationMin,
      fare: this._fare ? this._fare.toJSON() : null,
      paymentMethod: this._paymentMethodName,
      cancellationFee: this.getCancellationFee(),
      createdAt: this._createdAt.toISOString(),
      completedAt: this._completedAt ? this._completedAt.toISOString() : null
    };
  }
}
