import { BaseSqliteRepository } from './BaseSqliteRepository';
import { Ride, RideStatus } from '../domain/rides/Ride';
import { StandardRide } from '../domain/rides/StandardRide';
import { SharedRide } from '../domain/rides/SharedRide';
import { ScheduledRide } from '../domain/rides/ScheduledRide';
import { OutstationRide } from '../domain/rides/OutstationRide';
import { UserRepository } from './UserRepository';
import { VehicleRepository } from './VehicleRepository';
import { Customer } from '../domain/Customer';
import { Driver } from '../domain/Driver';
import { IDatabase } from '../db/database';
import { Fare } from '../domain/pricing/Fare';
import { NotFoundError } from '../errors';

interface RideDbRow {
  id: string;
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  vehicle_type: string;
  ride_type?: string;
  scheduled_time?: string | null;
  passenger_count?: number | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address: string;
  distance_km: number;
  duration_minutes: number;
  estimated_fare: number;
  final_fare: number | null;
  status: RideStatus;
  promo_code_id: string | null;
  created_at: string;
  completed_at: string | null;
}

/** OOP: Inheritance, Polymorphism
 *  WHY: Extends BaseSqliteRepository to persist and hydrate polymorphic Ride subclasses (Standard, Shared, Scheduled, Outstation) preserving state machine integrity. */
export class RideRepository extends BaseSqliteRepository<Ride> {
  // ENCAPSULATION: Sub-repositories are private
  private readonly _userRepo: UserRepository;
  private readonly _vehicleRepo: VehicleRepository;

  constructor(db?: IDatabase, userRepo?: UserRepository, vehicleRepo?: VehicleRepository) {
    super('rides', db);
    this._userRepo = userRepo || new UserRepository(this._db);
    this._vehicleRepo = vehicleRepo || new VehicleRepository(this._db);

    // Ensure extended columns exist
    try {
      this._db.exec("ALTER TABLE rides ADD COLUMN ride_type TEXT DEFAULT 'STANDARD_RIDE';");
    } catch { /* already exists */ }
    try {
      this._db.exec('ALTER TABLE rides ADD COLUMN scheduled_time TEXT;');
    } catch { /* already exists */ }
    try {
      this._db.exec('ALTER TABLE rides ADD COLUMN passenger_count INTEGER DEFAULT 1;');
    } catch { /* already exists */ }
    try {
      this._db.exec("ALTER TABLE rides ADD COLUMN payment_method TEXT DEFAULT 'WALLET';");
    } catch { /* already exists */ }
    try {
      this._db.exec('ALTER TABLE rides ADD COLUMN otp TEXT;');
    } catch { /* already exists */ }
    try {
      this._db.exec('ALTER TABLE rides ADD COLUMN tracking_token TEXT;');
    } catch { /* already exists */ }
  }

  public findByCustomerId(customerId: string): Ride[] {
    const rows = this._db
      .prepare('SELECT * FROM rides WHERE customer_id = ? ORDER BY created_at DESC')
      .all(customerId) as RideDbRow[];

    return rows.map((r) => this.mapRowToEntity(r));
  }

  public findByDriverId(driverId: string): Ride[] {
    const rows = this._db
      .prepare('SELECT * FROM rides WHERE driver_id = ? ORDER BY created_at DESC')
      .all(driverId) as RideDbRow[];

    return rows.map((r) => this.mapRowToEntity(r));
  }

  public findRequestedRides(): Ride[] {
    const rows = this._db
      .prepare("SELECT * FROM rides WHERE status = 'REQUESTED' ORDER BY created_at ASC")
      .all() as RideDbRow[];

    return rows.map((r) => this.mapRowToEntity(r));
  }

  protected mapEntityToRow(ride: Ride): Record<string, unknown> {
    const fare = ride.getFare();
    const driver = ride.getDriver();

    return {
      id: ride.getId(),
      customer_id: ride.getCustomer().getId(),
      driver_id: driver ? driver.getId() : null,
      vehicle_id: `veh-${ride.getVehicle().getPlateNumber()}`,
      vehicle_type: ride.getVehicle().getVehicleType(),
      ride_type: ride.getRideType(),
      scheduled_time:
        ride instanceof ScheduledRide
          ? ride.getScheduledPickupTime().toISOString()
          : null,
      passenger_count:
        ride instanceof SharedRide ? ride.getPassengerCount() : 1,
      pickup_lat: ride.getPickupLocation().latitude,
      pickup_lng: ride.getPickupLocation().longitude,
      pickup_address: ride.getPickupLocation().address || 'Pickup',
      dropoff_lat: ride.getDropoffLocation().latitude,
      dropoff_lng: ride.getDropoffLocation().longitude,
      dropoff_address: ride.getDropoffLocation().address || 'Dropoff',
      distance_km: ride.getDistanceKm(),
      duration_minutes: ride.getDurationMin(),
      estimated_fare: fare ? fare.total : 0.0,
      final_fare: fare ? fare.total : null,
      status: ride.getStatus(),
      payment_method: ride.getPaymentMethodName(),
      otp: ride.getOtp(),
      tracking_token: ride.getTrackingToken(),
      created_at: ride.getCreatedAt().toISOString(),
      completed_at: ride.getCompletedAt() ? ride.getCompletedAt()!.toISOString() : null
    };
  }

  /**
   * INHERITANCE & POLYMORPHISM: Maps database row to polymorphic Ride subclass
   */
  protected mapRowToEntity(row: unknown): Ride {
    const r = row as RideDbRow;

    const customerUser = this._userRepo.findById(r.customer_id);
    if (!customerUser || !(customerUser instanceof Customer)) {
      throw new NotFoundError(`Customer with ID ${r.customer_id} not found for ride ${r.id}`);
    }

    let driver: Driver | null = null;
    if (r.driver_id) {
      const driverUser = this._userRepo.findById(r.driver_id);
      if (driverUser instanceof Driver) {
        driver = driverUser;
      }
    }

    // Vehicle lookup
    let vehicle = r.vehicle_id ? this._vehicleRepo.findById(r.vehicle_id) : null;
    if (!vehicle && driver && driver.getVehicle()) {
      vehicle = driver.getVehicle();
    }
    if (!vehicle) {
      // Reconstitute from vehicle type
      const dummyPlate = `SYS-${r.vehicle_type}-01`;
      vehicle = this._vehicleRepo.findByPlateNumber(dummyPlate);
      if (!vehicle) {
        vehicle = this._vehicleRepo.findAll()[0];
      }
    }

    const pickup = { latitude: r.pickup_lat, longitude: r.pickup_lng, address: r.pickup_address };
    const dropoff = { latitude: r.dropoff_lat, longitude: r.dropoff_lng, address: r.dropoff_address };
    const createdAt = r.created_at ? new Date(r.created_at) : new Date();

    const rideType = r.ride_type || 'STANDARD_RIDE';
    const otp = (r as any).otp;
    const trackingToken = (r as any).tracking_token;
    let ride: Ride;

    switch (rideType) {
      case 'SHARED_RIDE':
        ride = new SharedRide(
          r.id,
          customerUser,
          vehicle!,
          pickup,
          dropoff,
          r.distance_km,
          r.duration_minutes,
          r.passenger_count || 2,
          driver,
          r.status,
          createdAt,
          otp,
          trackingToken
        );
        break;

      case 'SCHEDULED_RIDE':
        ride = new ScheduledRide(
          r.id,
          customerUser,
          vehicle!,
          pickup,
          dropoff,
          r.distance_km,
          r.duration_minutes,
          r.scheduled_time ? new Date(r.scheduled_time) : new Date(Date.now() + 3600000),
          driver,
          r.status,
          createdAt,
          otp,
          trackingToken
        );
        break;

      case 'OUTSTATION_RIDE':
        ride = new OutstationRide(
          r.id,
          customerUser,
          vehicle!,
          pickup,
          dropoff,
          Math.max(50, r.distance_km),
          r.duration_minutes,
          driver,
          r.status,
          createdAt,
          otp,
          trackingToken
        );
        break;

      case 'STANDARD_RIDE':
      default:
        ride = new StandardRide(
          r.id,
          customerUser,
          vehicle!,
          pickup,
          dropoff,
          r.distance_km,
          r.duration_minutes,
          driver,
          r.status,
          createdAt,
          otp,
          trackingToken
        );
        break;
    }

    if ((r as any).payment_method) {
      ride.setPaymentMethodName((r as any).payment_method);
    }

    const fareValue = r.final_fare !== null && r.final_fare !== undefined ? r.final_fare : r.estimated_fare;
    if (fareValue !== null && fareValue !== undefined) {
      ride.setFare(new Fare(fareValue, 0, 0, 1.0, 0, 0, fareValue));
    }

    return ride;
  }
}
