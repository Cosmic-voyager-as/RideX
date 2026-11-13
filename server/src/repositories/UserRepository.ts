import { BaseSqliteRepository } from './BaseSqliteRepository';
import { User, Role } from '../domain/User';
import { Customer } from '../domain/Customer';
import { Driver, DriverStatus } from '../domain/Driver';
import { Admin } from '../domain/Admin';
import { WalletRepository } from './WalletRepository';
import { VehicleRepository } from './VehicleRepository';
import { RatingRepository } from './RatingRepository';
import { Wallet } from '../domain/Wallet';
import { IDatabase } from '../db/database';
import { ValidationError } from '../errors';

interface UserDbRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  role: Role;
  department: string | null;
  license_number: string | null;
  status: DriverStatus | null;
  current_lat: number | null;
  current_lng: number | null;
  current_address: string | null;
  earnings: number | null;
  rating_average: number | null;
  rating_count: number | null;
  is_blocked?: number | null;
  created_at: string;
}

/** OOP: Inheritance, Polymorphism
 *  WHY: Extends BaseSqliteRepository to persist and hydrate polymorphic User entities (Customer, Driver, Admin) along with their encapsulated aggregate roots. */
export class UserRepository extends BaseSqliteRepository<User> {
  // ENCAPSULATION: Sub-repositories are private
  private readonly _walletRepo: WalletRepository;
  private readonly _vehicleRepo: VehicleRepository;
  private readonly _ratingRepo: RatingRepository;

  constructor(
    db?: IDatabase,
    walletRepo?: WalletRepository,
    vehicleRepo?: VehicleRepository,
    ratingRepo?: RatingRepository
  ) {
    super('users', db);
    this._walletRepo = walletRepo || new WalletRepository(this._db);
    this._vehicleRepo = vehicleRepo || new VehicleRepository(this._db);
    this._ratingRepo = ratingRepo || new RatingRepository(this._db);

    // Ensure is_blocked column exists
    try {
      this._db.exec('ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0;');
    } catch {
      // Column already exists
    }
  }

  public findByEmail(email: string): User | null {
    const row = this._db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as UserDbRow | undefined;

    return row ? this.mapRowToEntity(row) : null;
  }

  public findOnlineDrivers(): Driver[] {
    const rows = this._db
      .prepare("SELECT * FROM users WHERE role = 'DRIVER' AND status = 'ONLINE' AND (is_blocked IS NULL OR is_blocked = 0)")
      .all() as UserDbRow[];

    return rows.map((r) => this.mapRowToEntity(r) as Driver);
  }

  public blockUser(id: string, isBlocked: boolean = true): void {
    this._db
      .prepare('UPDATE users SET is_blocked = ? WHERE id = ?')
      .run(isBlocked ? 1 : 0, id);
  }

  public override save(user: User): void {
    // 1. Save user table record
    super.save(user);

    // 2. Cascade save aggregated dependencies
    if (user instanceof Customer) {
      this._walletRepo.save(user.getWallet());
    } else if (user instanceof Driver) {
      const vehicle = user.getVehicle();
      if (vehicle) {
        this._vehicleRepo.save(vehicle, user.getId());
      }
    }
  }

  /**
   * INHERITANCE: Maps polymorphic User to table columns
   */
  protected mapEntityToRow(user: User): Record<string, unknown> {
    const baseRow: Record<string, unknown> = {
      id: user.getId(),
      name: user.getName(),
      email: user.getEmail(),
      password_hash: user.getPasswordHashForPersistence(),
      phone: user.getPhone(),
      role: user.getRole(),
      created_at: user.getCreatedAt().toISOString()
    };

    if (user instanceof Customer) {
      baseRow.department = null;
      baseRow.license_number = null;
      baseRow.status = null;
    } else if (user instanceof Driver) {
      baseRow.license_number = user.getLicenseNumber();
      baseRow.status = user.getStatus();
      const loc = user.getCurrentLocation();
      baseRow.current_lat = loc ? loc.latitude : null;
      baseRow.current_lng = loc ? loc.longitude : null;
      baseRow.current_address = loc ? loc.address : null;
      baseRow.earnings = user.getEarnings();
      baseRow.rating_average = user.getRatingAverage();
      baseRow.rating_count = user.getRatingCount();
    } else if (user instanceof Admin) {
      baseRow.department = user.getDepartment();
    }

    return baseRow;
  }

  /**
   * INHERITANCE & POLYMORPHISM: Factory reconstitution of specialized User subclass
   */
  protected mapRowToEntity(row: unknown): User {
    const r = row as UserDbRow;

    switch (r.role) {
      case 'CUSTOMER': {
        // Hydrate customer's wallet
        let wallet = this._walletRepo.findByUserId(r.id);
        if (!wallet) {
          wallet = new Wallet(`w-${r.id}`, r.id, 0.0);
          this._walletRepo.save(wallet);
        }

        // Hydrate saved places
        const savedPlacesRows = this._db
          .prepare('SELECT id, name, latitude, longitude, address FROM saved_places WHERE user_id = ?')
          .all(r.id) as Array<{ id: string; name: string; latitude: number; longitude: number; address: string }>;

        return new Customer(
          r.id,
          r.name,
          r.email,
          r.password_hash,
          r.phone,
          wallet,
          savedPlacesRows,
          [],
          new Date(r.created_at)
        );
      }

      case 'DRIVER': {
        const vehicle = this._vehicleRepo.findByDriverId(r.id);
        const ratings = this._ratingRepo.findByDriverId(r.id).map((review) => review.score);

        const loc =
          r.current_lat !== null && r.current_lng !== null
            ? {
                latitude: r.current_lat,
                longitude: r.current_lng,
                address: r.current_address || undefined
              }
            : null;

        return new Driver(
          r.id,
          r.name,
          r.email,
          r.password_hash,
          r.phone,
          r.license_number || 'UNKNOWN_LICENSE',
          vehicle,
          r.status || 'OFFLINE',
          loc,
          r.earnings || 0.0,
          ratings,
          new Date(r.created_at)
        );
      }

      case 'ADMIN': {
        return new Admin(
          r.id,
          r.name,
          r.email,
          r.password_hash,
          r.phone,
          r.department || 'Operations',
          new Date(r.created_at)
        );
      }

      default:
        throw new ValidationError(`Unknown user role: ${r.role}`);
    }
  }
}

