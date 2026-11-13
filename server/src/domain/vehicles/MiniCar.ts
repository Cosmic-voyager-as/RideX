import { Vehicle, VehicleCategory } from '../Vehicle';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Vehicle for budget 4-seater compact hatchbacks, balancing affordability with enclosed car comfort. */
export class MiniCar extends Vehicle {
  constructor(plateNumber: string, model: string, color: string, year?: number) {
    // INHERITANCE: Standard 4 passenger hatchback capacity
    super(plateNumber, model, color, 4, year);
  }

  // POLYMORPHISM: Compact car base fare
  public override getBaseFare(): number {
    return 5.00;
  }

  // POLYMORPHISM: Compact car distance rate
  public override getPerKmRate(): number {
    return 1.40;
  }

  // POLYMORPHISM: Compact car duration rate
  public override getPerMinuteRate(): number {
    return 0.25;
  }

  public override getVehicleType(): VehicleCategory {
    return 'MINI';
  }
}

