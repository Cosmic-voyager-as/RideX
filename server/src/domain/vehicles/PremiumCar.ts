import { Vehicle, VehicleCategory } from '../Vehicle';

/** OOP: Inheritance, Polymorphism
 *  WHY: Specializes Vehicle for executive luxury rides, overriding base tariffs and enhancing the describe() template method with premium amenities. */
export class PremiumCar extends Vehicle {
  constructor(
    plateNumber: string,
    model: string,
    color: string,
    seatingCapacity: number = 4,
    year?: number
  ) {
    // INHERITANCE: Executive luxury car seating (default 4 seats)
    super(plateNumber, model, color, seatingCapacity, year);
  }

  // POLYMORPHISM: Luxury tier base fare
  public override getBaseFare(): number {
    return 15.00;
  }

  // POLYMORPHISM: Luxury tier per km rate
  public override getPerKmRate(): number {
    return 3.20;
  }

  // POLYMORPHISM: Luxury tier per minute rate
  public override getPerMinuteRate(): number {
    return 0.60;
  }

  public override getVehicleType(): VehicleCategory {
    return 'PREMIUM';
  }

  /**
   * POLYMORPHISM: Overrides superclass describe() template method to showcase specialized luxury features
   */
  public override describe(): string {
    return `${super.describe()} | [Premium service: Chauffeur certified, complimentary Wi-Fi, bottled water, and climate control]`;
  }
}

