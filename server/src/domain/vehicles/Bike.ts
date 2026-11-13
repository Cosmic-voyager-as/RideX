import { Vehicle, VehicleCategory } from '../Vehicle';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Vehicle for two-wheeled single passenger rides with economical, ultra-low urban base fares. */
export class Bike extends Vehicle {
  constructor(plateNumber: string, model: string, color: string, year?: number) {
    // INHERITANCE: Bikes are hardcoded to single passenger capacity
    super(plateNumber, model, color, 1, year);
  }

  // POLYMORPHISM: Low base fare for two-wheelers
  public override getBaseFare(): number {
    return 2.50;
  }

  // POLYMORPHISM: Economical per kilometer rate
  public override getPerKmRate(): number {
    return 0.80;
  }

  // POLYMORPHISM: Minimal per minute rate
  public override getPerMinuteRate(): number {
    return 0.15;
  }

  public override getVehicleType(): VehicleCategory {
    return 'BIKE';
  }
}

