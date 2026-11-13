import { ValidationError } from '../errors';

export type VehicleCategory = 'BIKE' | 'AUTO' | 'MINI' | 'SEDAN' | 'SUV' | 'PREMIUM';

/** OOP: Abstraction, Inheritance, Polymorphism
 *  WHY: Defines the abstract template for all vehicles, encapsulating vehicle specifications and establishing polymorphic contracts for fare calculation and description. */
export abstract class Vehicle {
  // ENCAPSULATION: Protected fields accessible to derived vehicle classes but encapsulated from external callers
  protected readonly _plateNumber: string;
  protected readonly _model: string;
  protected readonly _color: string;
  protected readonly _seatingCapacity: number;
  protected readonly _year: number;

  constructor(
    plateNumber: string,
    model: string,
    color: string,
    seatingCapacity: number,
    year: number = new Date().getFullYear()
  ) {
    // ABSTRACTION: Runtime guard enforcing that abstract class cannot be instantiated directly
    if (new.target === Vehicle) {
      throw new Error('Cannot instantiate abstract class Vehicle directly');
    }

    if (!plateNumber || plateNumber.trim().length === 0) {
      throw new ValidationError('Plate number is required');
    }
    if (!model || model.trim().length === 0) {
      throw new ValidationError('Model name is required');
    }
    if (!color || color.trim().length === 0) {
      throw new ValidationError('Color is required');
    }
    if (!seatingCapacity || seatingCapacity <= 0) {
      throw new ValidationError('Seating capacity must be at least 1');
    }

    this._plateNumber = plateNumber.trim().toUpperCase();
    this._model = model.trim();
    this._color = color.trim();
    this._seatingCapacity = seatingCapacity;
    this._year = year;
  }

  // ENCAPSULATION: Read-only accessors
  public getPlateNumber(): string {
    return this._plateNumber;
  }

  public getModel(): string {
    return this._model;
  }

  public getColor(): string {
    return this._color;
  }

  public getSeatingCapacity(): number {
    return this._seatingCapacity;
  }

  public getYear(): number {
    return this._year;
  }

  // ABSTRACTION & POLYMORPHISM: Abstract methods defining contract for vehicle fare economics
  public abstract getBaseFare(): number;
  public abstract getPerKmRate(): number;
  public abstract getPerMinuteRate(): number;
  public abstract getVehicleType(): VehicleCategory;

  /**
   * POLYMORPHISM: Unified fare calculation algorithm.
   * Invokes polymorphic methods (getBaseFare, getPerKmRate, getPerMinuteRate) resolved at runtime
   * without any `if (type === ...)` conditionals.
   */
  public calculateFare(distanceKm: number, durationMinutes: number = 0): number {
    if (distanceKm < 0 || durationMinutes < 0) {
      throw new ValidationError('Distance and duration must be non-negative values');
    }

    const fare =
      this.getBaseFare() +
      distanceKm * this.getPerKmRate() +
      durationMinutes * this.getPerMinuteRate();

    return Math.round(fare * 100) / 100;
  }

  /**
   * POLYMORPHISM / TEMPLATE METHOD PATTERN:
   * Concrete describe() skeleton that relies on polymorphic abstract hooks (getVehicleType, getBaseFare, getPerKmRate)
   */
  public describe(): string {
    return `${this.getVehicleType()}: ${this._color} ${this._model} (Plate: ${this._plateNumber}, Seats: ${this._seatingCapacity}, Base: $${this.getBaseFare().toFixed(2)}, Rate: $${this.getPerKmRate().toFixed(2)}/km)`;
  }

  public toJSON(): Record<string, unknown> {
    return {
      plateNumber: this._plateNumber,
      model: this._model,
      color: this._color,
      seatingCapacity: this._seatingCapacity,
      year: this._year,
      type: this.getVehicleType(),
      baseFare: this.getBaseFare(),
      perKmRate: this.getPerKmRate(),
      perMinuteRate: this.getPerMinuteRate()
    };
  }
}

