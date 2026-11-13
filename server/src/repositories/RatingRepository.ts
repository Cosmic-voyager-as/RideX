import { BaseSqliteRepository } from './BaseSqliteRepository';
import { IDatabase } from '../db/database';

export interface RatingRecord {
  id: string;
  rideId: string;
  customerId: string;
  driverId: string;
  score: number;
  comment: string | null;
  createdAt: Date;
}

interface RatingDbRow {
  id: string;
  ride_id: string;
  customer_id: string;
  driver_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

/** OOP: Inheritance
 *  WHY: Specializes BaseSqliteRepository for customer-to-driver reviews and rating metrics. */
export class RatingRepository extends BaseSqliteRepository<RatingRecord> {
  constructor(db?: IDatabase) {
    super('ratings', db);
  }

  public findByDriverId(driverId: string): RatingRecord[] {
    const rows = this._db
      .prepare('SELECT * FROM ratings WHERE driver_id = ? ORDER BY created_at DESC')
      .all(driverId) as RatingDbRow[];

    return rows.map((r) => this.mapRowToEntity(r));
  }

  public findByRideId(rideId: string): RatingRecord | null {
    const row = this._db
      .prepare('SELECT * FROM ratings WHERE ride_id = ?')
      .get(rideId) as RatingDbRow | undefined;

    return row ? this.mapRowToEntity(row) : null;
  }

  protected mapEntityToRow(entity: RatingRecord): Record<string, unknown> {
    return {
      id: entity.id,
      ride_id: entity.rideId,
      customer_id: entity.customerId,
      driver_id: entity.driverId,
      score: entity.score,
      comment: entity.comment,
      created_at: entity.createdAt.toISOString()
    };
  }

  protected mapRowToEntity(row: unknown): RatingRecord {
    const r = row as RatingDbRow;
    return {
      id: r.id,
      rideId: r.ride_id,
      customerId: r.customer_id,
      driverId: r.driver_id,
      score: r.score,
      comment: r.comment,
      createdAt: new Date(r.created_at)
    };
  }
}

