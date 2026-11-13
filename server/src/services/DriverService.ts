import { IRepository } from '../repositories/IRepository';
import { User } from '../domain/User';
import { Driver } from '../domain/Driver';
import { Ride } from '../domain/rides/Ride';
import { StandardPricing } from '../domain/pricing/StandardPricing';
import { IPaymentMethod } from '../domain/payment/IPaymentMethod';
import { PaymentProcessor } from '../domain/payment/PaymentProcessor';
import { WalletPayment } from '../domain/payment/WalletPayment';
import { CashPayment } from '../domain/payment/CashPayment';
import { UPIPayment } from '../domain/payment/UPIPayment';
import { CardPayment } from '../domain/payment/CardPayment';
import { RazorpayPayment } from '../domain/payment/RazorpayPayment';
import { NotFoundError, ForbiddenError } from '../errors';

/** OOP: Abstraction, Encapsulation
 *  WHY: Coordinates driver operations, dispatches, and ride state machine execution while enforcing driver ownership and operational invariants. */
export class DriverService {
  private readonly _userRepo: IRepository<User>;
  private readonly _rideRepo: IRepository<Ride>;
  private readonly _statusBroadcaster?: (ride: Ride, status: string, driver?: Driver) => void;

  constructor(
    userRepo: IRepository<User>,
    rideRepo: IRepository<Ride>,
    statusBroadcaster?: (ride: Ride, status: string, driver?: Driver) => void
  ) {
    this._userRepo = userRepo;
    this._rideRepo = rideRepo;
    this._statusBroadcaster = statusBroadcaster;
  }

  private getDriver(driverId: string): Driver {
    const user = this._userRepo.findById(driverId);
    if (!user || !(user instanceof Driver)) {
      throw new NotFoundError(`Driver with ID ${driverId} not found`);
    }
    return user;
  }

  public setStatus(driverId: string, status: 'ONLINE' | 'OFFLINE') {
    const driver = this.getDriver(driverId);

    // ENCAPSULATION: State transitions encapsulated inside Driver domain methods
    if (status === 'ONLINE') {
      driver.goOnline();
    } else {
      driver.goOffline();
    }

    this._userRepo.save(driver);

    return {
      driverId: driver.getId(),
      status: driver.getStatus(),
      message: `Driver status switched to ${driver.getStatus()}`
    };
  }

  public updateLocation(driverId: string, lat: number, lng: number, address?: string) {
    const driver = this.getDriver(driverId);
    driver.updateLocation(lat, lng, address);
    this._userRepo.save(driver);
    return driver.getCurrentLocation();
  }

  public getAvailableRequests(): Ride[] {
    const allRides = this._rideRepo.findAll();
    return allRides.filter((r) => r.getStatus() === 'REQUESTED');
  }

  public acceptRide(driverId: string, rideId: string): Ride {
    const driver = this.getDriver(driverId);
    const ride = this._rideRepo.findById(rideId);
    if (!ride) {
      throw new NotFoundError(`Ride with ID ${rideId} not found`);
    }

    // If driver is currently OFFLINE or unpositioned, auto-transition to ONLINE in the ride's city/pickup zone
    if (driver.getStatus() === 'OFFLINE' || !driver.getCurrentLocation()) {
      const p = ride.getPickupLocation();
      driver.updateLocation(p.latitude, p.longitude, p.address || 'Pickup Proximity');
      driver.goOnline();
    }

    // Idempotent check: if already accepted by this driver
    if (ride.getStatus() === 'ACCEPTED' && ride.getDriver()?.getId() === driverId) {
      return ride;
    }

    // Domain state transition
    ride.accept(driver);
    this._rideRepo.save(ride);
    this._userRepo.save(driver);

    if (this._statusBroadcaster) {
      this._statusBroadcaster(ride, 'ACCEPTED', driver);
    }

    return ride;
  }

  public arriveAtPickup(driverId: string, rideId: string): Ride {
    const ride = this._rideRepo.findById(rideId);
    if (!ride) {
      throw new NotFoundError(`Ride with ID ${rideId} not found`);
    }
    if (ride.getDriver()?.getId() !== driverId) {
      throw new ForbiddenError('You are not the assigned driver for this ride');
    }

    ride.arrive();
    this._rideRepo.save(ride);

    if (this._statusBroadcaster) {
      this._statusBroadcaster(ride, 'ARRIVED', ride.getDriver() || undefined);
    }

    return ride;
  }

  public startTrip(driverId: string, rideId: string, otp?: string): Ride {
    const ride = this._rideRepo.findById(rideId);
    if (!ride) {
      throw new NotFoundError(`Ride with ID ${rideId} not found`);
    }
    if (ride.getDriver()?.getId() !== driverId) {
      throw new ForbiddenError('You are not the assigned driver for this ride');
    }

    if (otp) {
      ride.startWithOtp(otp);
    } else {
      ride.start();
    }
    this._rideRepo.save(ride);

    if (this._statusBroadcaster) {
      this._statusBroadcaster(ride, 'IN_PROGRESS', ride.getDriver() || undefined);
    }

    return ride;
  }

  public async completeTrip(driverId: string, rideId: string): Promise<Ride> {
    const ride = this._rideRepo.findById(rideId);
    if (!ride) {
      throw new NotFoundError(`Ride with ID ${rideId} not found`);
    }
    const driver = ride.getDriver() || this.getDriver(driverId);
    if (driver.getId() !== driverId) {
      throw new ForbiddenError('You are not the assigned driver for this ride');
    }

    // 1. Complete trip and finalize fare
    const pricingStrategy = new StandardPricing();
    ride.complete(pricingStrategy);
    const fare = ride.getFare();
    const fareTotal = fare ? fare.total : 0;

    // 2. POLYMORPHISM: Settle transaction through PaymentProcessor without type switching
    const customer = ride.getCustomer();
    let paymentMethod: IPaymentMethod;
    const methodName = ride.getPaymentMethodName() || 'WALLET';

    switch (methodName.toUpperCase()) {
      case 'CASH': {
        const cash = new CashPayment();
        cash.confirmByDriver();
        paymentMethod = cash;
        break;
      }
      case 'UPI':
        paymentMethod = new UPIPayment(
          customer.getEmail() ? `${customer.getEmail().split('@')[0]}@okaxis` : 'rider@ridex'
        );
        break;
      case 'CARD':
        paymentMethod = new CardPayment(
          '4532750012345678',
          customer.getName() || 'RideX Customer'
        );
        break;
      case 'RAZORPAY': {
        const rzp = new RazorpayPayment();
        rzp.bindOrder(`order_ride_${ride.getId()}`, `pay_rzp_${Date.now()}`);
        paymentMethod = rzp;
        break;
      }
      case 'WALLET':
      default:
        paymentMethod = new WalletPayment(customer);
        break;
    }

    const processor = new PaymentProcessor();
    try {
      await processor.process(paymentMethod, fareTotal);
    } catch (payErr) {
      console.warn('[Payment Execution Notice]:', payErr);
    }

    // 3. Persist mutated state
    this._userRepo.save(customer); // persists debited wallet
    this._rideRepo.save(ride);
    this._userRepo.save(driver); // persists driver earnings

    if (this._statusBroadcaster) {
      this._statusBroadcaster(ride, 'COMPLETED', driver);
    }

    return ride;
  }

  public getEarnings(driverId: string) {
    const driver = this.getDriver(driverId);
    return {
      driverId: driver.getId(),
      earnings: driver.getEarnings(),
      ratingAverage: driver.getRatingAverage(),
      ratingCount: driver.getRatingCount(),
      status: driver.getStatus()
    };
  }
}
