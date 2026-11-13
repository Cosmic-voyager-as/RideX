import { User, Role, SavedPlace } from './User';
import { Wallet } from './Wallet';
import { ValidationError } from '../errors';

export interface IRateableDriver {
  getId(): string;
  addRating(score: number): void;
}

/** OOP: Inheritance
 *  WHY: Specializes User for riders by inheriting core identity and adding rider-specific wallet management, saved destinations, and driver rating behavior. */
export class Customer extends User {
  // ENCAPSULATION: Customer encapsulates a dedicated financial Wallet instance
  private readonly _wallet: Wallet;
  // ENCAPSULATION: Saved places list is private to protect customer privacy
  private readonly _savedPlaces: SavedPlace[];
  // ENCAPSULATION: Private ride history log
  private readonly _rideHistoryIds: string[];

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    phone: string,
    wallet: Wallet,
    savedPlaces: SavedPlace[] = [],
    rideHistoryIds: string[] = [],
    createdAt?: Date
  ) {
    // INHERITANCE: Delegates base user initialization to abstract User superclass
    super(id, name, email, passwordHash, phone, createdAt);

    if (!wallet) {
      throw new ValidationError('Customer must be associated with a valid Wallet');
    }
    this._wallet = wallet;
    this._savedPlaces = [...savedPlaces];
    this._rideHistoryIds = [...rideHistoryIds];
  }

  // ENCAPSULATION: Wallet reference is exposed for domain operations
  public getWallet(): Wallet {
    return this._wallet;
  }

  // ENCAPSULATION: Read-only access returning defensive copy of saved places
  public getSavedPlaces(): readonly SavedPlace[] {
    return Object.freeze([...this._savedPlaces]);
  }

  public addSavedPlace(place: SavedPlace): void {
    if (!place.name || !place.address) {
      throw new ValidationError('Saved place requires name and address');
    }
    if (
      place.latitude < -90 ||
      place.latitude > 90 ||
      place.longitude < -180 ||
      place.longitude > 180
    ) {
      throw new ValidationError('Invalid latitude or longitude coordinate');
    }
    this._savedPlaces.push({ ...place });
  }

  public removeSavedPlace(placeId: string): void {
    const idx = this._savedPlaces.findIndex((p) => p.id === placeId);
    if (idx !== -1) {
      this._savedPlaces.splice(idx, 1);
    }
  }

  // ENCAPSULATION: Read-only access to ride history IDs
  public getRideHistoryIds(): readonly string[] {
    return Object.freeze([...this._rideHistoryIds]);
  }

  public recordRide(rideId: string): void {
    if (!rideId) {
      throw new ValidationError('Invalid ride ID');
    }
    this._rideHistoryIds.push(rideId);
  }

  /**
   * ABSTRACTION: Rates a driver conforming to the IRateableDriver interface
   */
  public rateDriver(driver: IRateableDriver, rating: number, _comment?: string): void {
    if (!driver) {
      throw new ValidationError('Driver is required to submit a rating');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be an integer between 1 and 5');
    }
    driver.addRating(rating);
  }

  // POLYMORPHISM: Concrete specialization of abstract getRole contract
  public override getRole(): Role {
    return 'CUSTOMER';
  }

  // POLYMORPHISM: Concrete specialization of abstract getDashboardPermissions contract
  public override getDashboardPermissions(): string[] {
    return [
      'book_ride',
      'view_rides',
      'manage_wallet',
      'rate_driver',
      'save_places',
      'apply_promo'
    ];
  }

  public override toPublicJSON(): Record<string, unknown> {
    return {
      ...super.toPublicJSON(),
      wallet: this._wallet.toPublicJSON(),
      savedPlacesCount: this._savedPlaces.length,
      ridesCount: this._rideHistoryIds.length
    };
  }
}

