import { IRepository } from './IRepository';
import { IDatabase, getDatabase } from '../db/database';

/** OOP: Abstraction, Inheritance
 *  WHY: Serves as the abstract base repository, encapsulating the database connection and standardizing CRUD contracts for all specialized domain repositories. */
export abstract class BaseRepository<T> implements IRepository<T> {
  // ENCAPSULATION: Database connection instance is protected and accessible only to concrete repositories
  protected readonly _db: IDatabase;

  constructor(db?: IDatabase) {
    if (new.target === BaseRepository) {
      throw new Error('Cannot instantiate abstract class BaseRepository directly');
    }
    this._db = db || getDatabase();
  }

  // ABSTRACTION: Force derived repositories to implement domain-specific persistence mappings
  public abstract findById(id: string): T | null;
  public abstract save(entity: T): void;
  public abstract delete(id: string): void;
  public abstract findAll(): T[];
}
