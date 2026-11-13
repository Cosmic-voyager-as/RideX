import { Vehicle, VehicleCategory } from '../Vehicle';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Vehicle for 6-seater high-capacity sports utility vehicles, designed for families and group luggage. */
export class SUV extends Vehicle {
  constructor(plateNumber: string, model: string, color: string, year?: number) {
    // INHERITANCE: High capacity 6 passenger seating
    super(plateNumber, model, color, 6, year);
  }

  // POLYMORPHISM: SUV base fare for larger engine and size
  public override getBaseFare(): number {
    return 10.00;
  }

  // POLYMORPHISM: Higher distance rate for heavy vehicles
  public override getPerKmRate(): number {
    return 2.40;
  }

  // POLYMORPHISM: Time tariff
  public override getPerMinuteRate(): number {
    return 0.45;
  }

  public override getVehicleType(): VehicleCategory {
    return 'SUV';
  }
}

