import { BaseSqliteRepository } from './BaseSqliteRepository';
import { Vehicle, VehicleCategory } from '../domain/Vehicle';
import { Bike } from '../domain/vehicles/Bike';
import { Auto } from '../domain/vehicles/Auto';
import { MiniCar } from '../domain/vehicles/MiniCar';
import { Sedan } from '../domain/vehicles/Sedan';
import { SUV } from '../domain/vehicles/SUV';
import { PremiumCar } from '../domain/vehicles/PremiumCar';
import { IDatabase } from '../db/database';
import { ValidationError } from '../errors';

interface VehicleDbRow {
  id: string;
  driver_id: string | null;
  plate_number: string;
  model: string;
  color: string;
  seating_capacity: number;
  vehicle_type: VehicleCategory;
  year: number;
}

/** OOP: Inheritance, Polymorphism
 *  WHY: Extends BaseSqliteRepository to persist and hydrate heterogeneous Vehicle subclasses using polymorphic mapping hooks. */
export class VehicleRepository extends BaseSqliteRepository<Vehicle> {
  constructor(db?: IDatabase) {
    super('vehicles', db);
  }

  public findByPlateNumber(plateNumber: string): Vehicle | null {
    const row = this._db
      .prepare('SELECT * FROM vehicles WHERE plate_number = ?')
      .get(plateNumber.toUpperCase());

    return row ? this.mapRowToEntity(row) : null;
  }

  public findByDriverId(driverId: string): Vehicle | null {
    const row = this._db
      .prepare('SELECT * FROM vehicles WHERE driver_id = ?')
      .get(driverId);

    return row ? this.mapRowToEntity(row) : null;
  }

  public override save(vehicle: Vehicle, driverId: string | null = null): void {
    const row = this.mapEntityToRow(vehicle);
    if (driverId) {
      row.driver_id = driverId;
    }
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(', ');
    const updateAssignments = keys
      .filter((k) => k !== 'id')
      .map((k) => `${k} = excluded.${k}`)
      .join(', ');

    const sql = `
      INSERT INTO ${this._tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(plate_number) DO UPDATE SET ${updateAssignments}
    `;

    const values = keys.map((k) => row[k]);
    this._db.prepare(sql).run(...values);
  }

  /**
   * INHERITANCE & TEMPLATE METHOD: Maps domain Vehicle entity to SQLite database row representation
   */
  protected mapEntityToRow(vehicle: Vehicle): Record<string, unknown> {
    return {
      id: `veh-${vehicle.getPlateNumber()}`,
      plate_number: vehicle.getPlateNumber(),
      model: vehicle.getModel(),
      color: vehicle.getColor(),
      seating_capacity: vehicle.getSeatingCapacity(),
      vehicle_type: vehicle.getVehicleType(),
      year: vehicle.getYear()
    };
  }

  /**
   * INHERITANCE & POLYMORPHISM: Maps database row to polymorphic Vehicle subclass
   */
  protected mapRowToEntity(row: unknown): Vehicle {
    const r = row as VehicleDbRow;
    switch (r.vehicle_type) {
      case 'BIKE':
        return new Bike(r.plate_number, r.model, r.color, r.year);
      case 'AUTO':
        return new Auto(r.plate_number, r.model, r.color, r.year);
      case 'MINI':
        return new MiniCar(r.plate_number, r.model, r.color, r.year);
      case 'SEDAN':
        return new Sedan(r.plate_number, r.model, r.color, r.year);
      case 'SUV':
        return new SUV(r.plate_number, r.model, r.color, r.year);
      case 'PREMIUM':
        return new PremiumCar(r.plate_number, r.model, r.color, r.seating_capacity, r.year);
      default:
        throw new ValidationError(`Unknown vehicle category in database: ${r.vehicle_type}`);
    }
  }
}
