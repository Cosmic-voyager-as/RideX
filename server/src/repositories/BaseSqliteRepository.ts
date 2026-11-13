import { IRepository } from './IRepository';
import { IDatabase, getDatabase } from '../db/database';

/** OOP: Abstraction, Inheritance
 *  WHY: Implements generic CRUD operations against SQLite using abstract serialization methods, allowing concrete repositories to focus exclusively on domain mapping. */
export abstract class BaseSqliteRepository<T> implements IRepository<T> {
  // ENCAPSULATION: Database driver and table metadata are protected
  protected readonly _db: IDatabase;
  protected readonly _tableName: string;

  constructor(tableName: string, db?: IDatabase) {
    if (new.target === BaseSqliteRepository) {
      throw new Error('Cannot instantiate abstract class BaseSqliteRepository directly');
    }
    this._tableName = tableName;
    this._db = db || getDatabase();
  }

  // ABSTRACTION & TEMPLATE METHOD: Subclasses provide domain-to-database hydration logic
  protected abstract mapRowToEntity(row: unknown): T;
  protected abstract mapEntityToRow(entity: T): Record<string, unknown>;

  /**
   * INHERITANCE: Reusable findById implementation relying on abstract mapRowToEntity hook
   */
  public findById(id: string): T | null {
    const row = this._db
      .prepare(`SELECT * FROM ${this._tableName} WHERE id = ?`)
      .get(id);

    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * INHERITANCE: Reusable findAll implementation relying on abstract mapRowToEntity hook
   */
  public findAll(): T[] {
    const rows = this._db.prepare(`SELECT * FROM ${this._tableName}`).all();
    return rows.map((r) => this.mapRowToEntity(r));
  }

  /**
   * INHERITANCE: Reusable delete implementation
   */
  public delete(id: string): void {
    this._db.prepare(`DELETE FROM ${this._tableName} WHERE id = ?`).run(id);
  }

  /**
   * INHERITANCE: Generic upsert mechanism relying on abstract mapEntityToRow hook
   */
  public save(entity: T): void {
    const row = this.mapEntityToRow(entity);
    const keys = Object.keys(row);
    if (keys.length === 0) return;

    const placeholders = keys.map(() => '?').join(', ');
    const updateAssignments = keys
      .filter((k) => k !== 'id')
      .map((k) => `${k} = excluded.${k}`)
      .join(', ');

    const sql = `
      INSERT INTO ${this._tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updateAssignments}
    `;

    const values = keys.map((k) => (row[k] === undefined ? null : row[k]));
    this._db.prepare(sql).run(...values);
  }
}

