import { User, Role, Location } from './User';
import { Vehicle } from './Vehicle';
import { ValidationError } from '../errors';
import { IRateableDriver } from './Customer';

export type DriverStatus = 'OFFLINE' | 'ONLINE' | 'ON_TRIP';

/** OOP: Inheritance
 *  WHY: Specializes User for service providers with vehicle assignment, real-time geolocation tracking, availability lifecycle, and aggregated rating metrics. */
export class Driver extends User implements IRateableDriver {
  // ENCAPSULATION: Professional driver license credentials kept strictly private
  private readonly _licenseNumber: string;
  // ENCAPSULATION: Associated vehicle instance encapsulated within driver entity
  private _vehicle: Vehicle | null;
  // ENCAPSULATION: Availability lifecycle status protected behind state transition methods
  private _status: DriverStatus;
  // ENCAPSULATION: GPS coordinate state encapsulated and guarded by coordinate validators
  private _currentLocation: Location | null;
  // ENCAPSULATION: Cumulative earnings protected from direct modification
  private _earnings: number;
  // ENCAPSULATION: Rating ledger kept private to ensure statistical integrity
  private readonly _ratings: number[];

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    phone: string,
    licenseNumber: string,
    vehicle: Vehicle | null = null,
    status: DriverStatus = 'OFFLINE',
    currentLocation: Location | null = null,
    earnings: number = 0.0,
    ratings: number[] = [],
    createdAt?: Date
  ) {
    // INHERITANCE: Delegates base user initialization to abstract User superclass
    super(id, name, email, passwordHash, phone, createdAt);

    if (!licenseNumber || licenseNumber.trim().length === 0) {
      throw new ValidationError('Driver requires a valid license number');
    }
    if (earnings < 0) {
      throw new ValidationError('Earnings cannot be negative');
    }

    this._licenseNumber = licenseNumber.trim().toUpperCase();
    this._vehicle = vehicle;
    this._status = status;
    this._currentLocation = currentLocation;
    this._earnings = Math.round(earnings * 100) / 100;
    this._ratings = [...ratings];
  }

  // ENCAPSULATION: Read-only accessors
  public getLicenseNumber(): string {
    return this._licenseNumber;
  }

  public getVehicle(): Vehicle | null {
    return this._vehicle;
  }

  public assignVehicle(vehicle: Vehicle): void {
    if (!vehicle) {
      throw new ValidationError('Assigned vehicle cannot be null');
    }
    this._vehicle = vehicle;
  }

  public getStatus(): DriverStatus {
    return this._status;
  }

  public getCurrentLocation(): Location | null {
    return this._currentLocation ? { ...this._currentLocation } : null;
  }

  public getEarnings(): number {
    return this._earnings;
  }

  public getRatingCount(): number {
    return this._ratings.length;
  }

  /**
   * Computes mathematical average of ratings with precision rounding.
   */
  public getRatingAverage(): number {
    if (this._ratings.length === 0) {
      return 0.0;
    }
    const sum = this._ratings.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / this._ratings.length) * 10) / 10;
  }

  /**
   * ABSTRACTION & ENCAPSULATION: Implements IRateableDriver
   */
  public addRating(score: number): void {
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new ValidationError('Rating score must be an integer between 1 and 5');
    }
    this._ratings.push(score);
  }

  /**
   * Lifecycle transition: driver goes online to accept rides.
   * Enforces business invariants.
   */
  public goOnline(): void {
    if (!this._vehicle) {
      throw new ValidationError('Cannot go online without an assigned vehicle');
    }
    if (!this._currentLocation) {
      this._currentLocation = {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Bengaluru Central'
      };
    }
    this._status = 'ONLINE';
  }

  /**
   * Lifecycle transition: driver goes offline.
   */
  public goOffline(): void {
    this._status = 'OFFLINE';
  }

  /**
   * Accepts a ride dispatched to this driver.
   */
  public acceptRide(rideId: string): void {
    if (!rideId || rideId.trim().length === 0) {
      throw new ValidationError('Ride ID is required to accept ride');
    }
    this._status = 'ON_TRIP';
  }

  /**
   * Completes a ride trip and records earnings.
   */
  public completeTrip(tripEarnings: number): void {
    if (this._status !== 'ON_TRIP') {
      throw new ValidationError('Cannot complete trip when not on an active trip');
    }
    if (typeof tripEarnings !== 'number' || isNaN(tripEarnings) || tripEarnings < 0) {
      throw new ValidationError('Trip earnings must be a non-negative number');
    }

    const rounded = Math.round(tripEarnings * 100) / 100;
    this._earnings = Math.round((this._earnings + rounded) * 100) / 100;
    this._status = 'ONLINE';
  }

  /**
   * Releases driver from an active trip if cancelled before completion
   */
  public releaseFromTrip(): void {
    if (this._status === 'ON_TRIP') {
      this._status = 'ONLINE';
    }
  }

  /**
   * Encapsulated GPS update with coordinate bounds validation.
   */
  public updateLocation(latitude: number, longitude: number, address?: string): void {
    if (
      typeof latitude !== 'number' ||
      isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new ValidationError(`Latitude must be between -90 and 90. Received: ${latitude}`);
    }
    if (
      typeof longitude !== 'number' ||
      isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new ValidationError(`Longitude must be between -180 and 180. Received: ${longitude}`);
    }

    this._currentLocation = {
      latitude,
      longitude,
      address
    };
  }

  // POLYMORPHISM: Specialization of abstract getRole contract
  public override getRole(): Role {
    return 'DRIVER';
  }

  // POLYMORPHISM: Specialization of abstract getDashboardPermissions contract
  public override getDashboardPermissions(): string[] {
    return [
      'accept_ride',
      'update_location',
      'view_earnings',
      'toggle_status',
      'view_vehicle',
      'complete_trip'
    ];
  }

  public override toPublicJSON(): Record<string, unknown> {
    return {
      ...super.toPublicJSON(),
      licenseNumber: this._licenseNumber,
      status: this._status,
      currentLocation: this.getCurrentLocation(),
      earnings: this._earnings,
      ratingAverage: this.getRatingAverage(),
      ratingCount: this.getRatingCount(),
      vehicle: this._vehicle ? this._vehicle.toJSON() : null
    };
  }
}

