import { Vehicle, VehicleCategory } from '../Vehicle';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Vehicle for standard 4-seater sedans, offering enhanced legroom, boot space, and balanced standard rates. */
export class Sedan extends Vehicle {
  constructor(plateNumber: string, model: string, color: string, year?: number) {
    // INHERITANCE: Standard 4 passenger sedan capacity
    super(plateNumber, model, color, 4, year);
  }

  // POLYMORPHISM: Standard sedan base fare
  public override getBaseFare(): number {
    return 7.00;
  }

  // POLYMORPHISM: Standard sedan distance rate
  public override getPerKmRate(): number {
    return 1.80;
  }

  // POLYMORPHISM: Standard sedan duration rate
  public override getPerMinuteRate(): number {
    return 0.35;
  }

  public override getVehicleType(): VehicleCategory {
    return 'SEDAN';
  }
}

