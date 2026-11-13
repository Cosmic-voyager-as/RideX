/** OOP: Abstraction
 *  WHY: Defines a generic data access contract decoupling domain services from database query syntax and persistence mechanisms. */
export interface IRepository<T> {
  /**
   * Retrieves an entity by its unique identifier
   */
  findById(id: string): T | null;

  /**
   * Saves or updates an entity in the persistent storage
   */
  save(entity: T): void;

  /**
   * Deletes an entity by its unique identifier
   */
  delete(id: string): void;

  /**
   * Retrieves all entities conforming to type T
   */
  findAll(): T[];
}
