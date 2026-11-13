import { Vehicle, VehicleCategory } from '../Vehicle';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Vehicle for three-wheeler autorickshaw rides with 3-passenger seating and mid-tier urban transit rates. */
export class Auto extends Vehicle {
  constructor(plateNumber: string, model: string, color: string, year?: number) {
    // INHERITANCE: Auto-rickshaws standard seating is 3 passengers
    super(plateNumber, model, color, 3, year);
  }

  // POLYMORPHISM: Moderate base fare
  public override getBaseFare(): number {
    return 3.50;
  }

  // POLYMORPHISM: City transit rate
  public override getPerKmRate(): number {
    return 1.10;
  }

  // POLYMORPHISM: Low per minute idle rate
  public override getPerMinuteRate(): number {
    return 0.20;
  }

  public override getVehicleType(): VehicleCategory {
    return 'AUTO';
  }
}

