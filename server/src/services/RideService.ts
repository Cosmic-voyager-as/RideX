import { IRepository } from '../repositories/IRepository';
import { Ride } from '../domain/rides/Ride';
import { StandardRide } from '../domain/rides/StandardRide';
import { SharedRide } from '../domain/rides/SharedRide';
import { ScheduledRide } from '../domain/rides/ScheduledRide';
import { OutstationRide } from '../domain/rides/OutstationRide';
import { User } from '../domain/User';
import { Customer } from '../domain/Customer';
import { Vehicle, VehicleCategory } from '../domain/Vehicle';
import { Location } from '../domain/User';
import { StandardPricing } from '../domain/pricing/StandardPricing';
import { PromoPricing } from '../domain/pricing/PromoPricing';
import { IPricingStrategy } from '../domain/pricing/IPricingStrategy';
import { Fare } from '../domain/pricing/Fare';
import { RatingRecord } from '../repositories/RatingRepository';
import { PromoCode } from '../domain/promo/PromoCode';
import { UserFactory } from '../domain/UserFactory';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors';

export interface CreateRideDTO {
  customerId: string;
  rideType?: 'STANDARD_RIDE' | 'SHARED_RIDE' | 'SCHEDULED_RIDE' | 'OUTSTATION_RIDE';
  vehicleCategory: VehicleCategory;
  pickup: Location;
  dropoff: Location;
  distanceKm: number;
  durationMin: number;
  passengerCount?: number;
  scheduledTime?: string;
  promoCode?: string;
  paymentMethod?: string;
}

/** OOP: Abstraction, Polymorphism
 *  WHY: Orchestrates ride estimation, booking, and lifecycle state changes by interacting with abstract IRepository contracts and polymorphic Ride models. */
export class RideService {
  private readonly _userRepo: IRepository<User>;
  private readonly _rideRepo: IRepository<Ride>;
  private readonly _vehicleRepo: IRepository<Vehicle>;
  private readonly _ratingRepo: IRepository<RatingRecord>;
  private readonly _promoRepo: IRepository<PromoCode>;

  constructor(
    userRepo: IRepository<User>,
    rideRepo: IRepository<Ride>,
    vehicleRepo: IRepository<Vehicle>,
    ratingRepo: IRepository<RatingRecord>,
    promoRepo: IRepository<PromoCode>
  ) {
    this._userRepo = userRepo;
    this._rideRepo = rideRepo;
    this._vehicleRepo = vehicleRepo;
    this._ratingRepo = ratingRepo;
    this._promoRepo = promoRepo;
  }

  /**
   * Estimates fare polymorphically for a selected vehicle category and promotional code
   */
  public estimateFare(
    vehicleCategory: VehicleCategory,
    distanceKm: number,
    durationMin: number,
    promoCodeString?: string
  ): Fare {
    const sampleVehicle = UserFactory.createVehicle(vehicleCategory, 'EST-01', 'Standard', 'White');
    let strategy: IPricingStrategy = new StandardPricing();

    if (promoCodeString) {
      const allPromos = this._promoRepo.findAll();
      const promo = allPromos.find((p) => p.getCode() === promoCodeString.trim().toUpperCase());
      if (promo && promo.isActive() && !promo.isExpired()) {
        strategy = new PromoPricing(strategy, promo.getDiscountPercentage(), promo.getMaxDiscount());
      }
    }

    return strategy.calculate(distanceKm, durationMin, sampleVehicle);
  }

  /**
   * Instantiates and books a polymorphic Ride subclass based on requested ride category
   */
  public bookRide(dto: CreateRideDTO): Ride {
    const user = this._userRepo.findById(dto.customerId);
    if (!user || !(user instanceof Customer)) {
      throw new NotFoundError(`Customer not found for ID: ${dto.customerId}`);
    }

    // Allocate vehicle specification
    const vehicle = UserFactory.createVehicle(
      dto.vehicleCategory,
      `RIDEX-${dto.vehicleCategory}`,
      'Fleet Vehicle',
      'Silver'
    );
    this._vehicleRepo.save(vehicle);

    const rideId = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const rideType = dto.rideType || 'STANDARD_RIDE';

    // Defensively ensure valid distance and duration
    let distanceKm = Number(dto.distanceKm);
    let durationMin = Number(dto.durationMin);
    if (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) {
      const R = 6371;
      const dLat = ((dto.dropoff.latitude - dto.pickup.latitude) * Math.PI) / 180;
      const dLon = ((dto.dropoff.longitude - dto.pickup.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((dto.pickup.latitude * Math.PI) / 180) *
          Math.cos((dto.dropoff.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Math.max(1.5, Number((R * c).toFixed(1)));
    }
    if (!durationMin || isNaN(durationMin) || durationMin <= 0) {
      durationMin = Math.max(5, Math.round(distanceKm * 3.2));
    }

    let ride: Ride;

    // POLYMORPHISM: Instantiates concrete specialized Ride subclass
    switch (rideType) {
      case 'SHARED_RIDE':
        ride = new SharedRide(
          rideId,
          user,
          vehicle,
          dto.pickup,
          dto.dropoff,
          distanceKm,
          durationMin,
          dto.passengerCount || 2
        );
        break;

      case 'SCHEDULED_RIDE':
        if (!dto.scheduledTime) {
          throw new ValidationError('Scheduled rides require a future scheduledTime');
        }
        ride = new ScheduledRide(
          rideId,
          user,
          vehicle,
          dto.pickup,
          dto.dropoff,
          distanceKm,
          durationMin,
          new Date(dto.scheduledTime)
        );
        break;

      case 'OUTSTATION_RIDE':
        ride = new OutstationRide(
          rideId,
          user,
          vehicle,
          dto.pickup,
          dto.dropoff,
          Math.max(50, distanceKm),
          durationMin
        );
        break;

      case 'STANDARD_RIDE':
      default:
        ride = new StandardRide(
          rideId,
          user,
          vehicle,
          dto.pickup,
          dto.dropoff,
          distanceKm,
          durationMin
        );
        break;
    }

    if (dto.paymentMethod) {
      ride.setPaymentMethodName(dto.paymentMethod);
    }

    // Calculate initial estimated fare
    let pricingStrategy: IPricingStrategy = new StandardPricing();
    if (dto.promoCode) {
      const allPromos = this._promoRepo.findAll();
      const promo = allPromos.find((p) => p.getCode() === dto.promoCode?.trim().toUpperCase());
      if (promo && promo.isValidFor(user)) {
        pricingStrategy = new PromoPricing(pricingStrategy, promo.getDiscountPercentage(), promo.getMaxDiscount());
      }
    }

    // Complete initial estimation and save
    ride.calculateFare(pricingStrategy);
    this._rideRepo.save(ride);

    return ride;
  }

  public getCustomerRides(customerId: string): Ride[] {
    const allRides = this._rideRepo.findAll();
    return allRides.filter((r) => r.getCustomer().getId() === customerId);
  }

  public getRideById(rideId: string): Ride {
    const ride = this._rideRepo.findById(rideId);
    if (!ride) {
      throw new NotFoundError(`Ride not found with ID: ${rideId}`);
    }
    return ride;
  }

  /**
   * Cancels a ride and calculates cancellation fee via polymorphic getCancellationFee()
   */
  public cancelRide(rideId: string, customerId: string, reason?: string): { fee: number; ride: Ride } {
    const ride = this.getRideById(rideId);
    if (ride.getCustomer().getId() !== customerId) {
      throw new ForbiddenError('You can only cancel your own rides');
    }

    // ENCAPSULATION & POLYMORPHISM: Domain state transition and cancellation penalty
    const fee = ride.cancel(reason || 'Customer requested cancellation');
    this._rideRepo.save(ride);

    return { fee, ride };
  }

  /**
   * Rates the driver for a completed ride
   */
  public rateDriver(rideId: string, customerId: string, score: number, comment?: string): RatingRecord {
    const ride = this.getRideById(rideId);
    if (ride.getCustomer().getId() !== customerId) {
      throw new ForbiddenError('You can only rate rides you participated in');
    }

    const driver = ride.getDriver();
    if (!driver) {
      throw new ValidationError('Cannot rate a ride that has no assigned driver');
    }

    // Call Customer domain method
    const customer = ride.getCustomer();
    customer.rateDriver(driver, score, comment);

    // Save driver rating and record
    this._userRepo.save(driver);

    const ratingRecord: RatingRecord = {
      id: `rat-${Date.now()}`,
      rideId,
      customerId,
      driverId: driver.getId(),
      score,
      comment: comment || null,
      createdAt: new Date()
    };

    this._ratingRepo.save(ratingRecord);
    return ratingRecord;
  }

  public getRideByTrackingToken(token: string): Ride {
    const allRides = this._rideRepo.findAll();
    const ride = allRides.find((r) => r.getTrackingToken() === token);
    if (!ride) {
      throw new NotFoundError(`Ride not found for tracking token: ${token}`);
    }
    return ride;
  }
}
