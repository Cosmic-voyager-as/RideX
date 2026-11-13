import { User, Role } from './User';
import { Customer } from './Customer';
import { Driver } from './Driver';
import { Admin } from './Admin';
import { Wallet } from './Wallet';
import { Vehicle, VehicleCategory } from './Vehicle';
import { Bike } from './vehicles/Bike';
import { Auto } from './vehicles/Auto';
import { MiniCar } from './vehicles/MiniCar';
import { Sedan } from './vehicles/Sedan';
import { SUV } from './vehicles/SUV';
import { PremiumCar } from './vehicles/PremiumCar';
import { ValidationError } from '../errors';

export interface CreateUserParams {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: Role;
  // Customer specific
  initialWalletBalance?: number;
  // Driver specific
  licenseNumber?: string;
  vehicleType?: VehicleCategory;
  plateNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: number;
  // Admin specific
  department?: string;
}

/** OOP: Polymorphism, Abstraction (Factory Pattern)
 *  WHY: Encapsulates instantiation logic for heterogeneous User subclasses, shielding callers from concrete subclass constructors and their respective aggregate roots. */
export class UserFactory {
  /**
   * FACTORY PATTERN: Instantiates the appropriate User subclass polymorphically based on requested role
   */
  public static createUser(params: CreateUserParams): User {
    switch (params.role) {
      case 'CUSTOMER': {
        const wallet = new Wallet(
          `w-${params.id}`,
          params.id,
          params.initialWalletBalance ?? 0.0
        );
        return new Customer(
          params.id,
          params.name,
          params.email,
          params.passwordHash,
          params.phone,
          wallet
        );
      }

      case 'DRIVER': {
        if (!params.licenseNumber) {
          throw new ValidationError('License number is required to register as a driver');
        }
        if (!params.plateNumber || !params.vehicleType) {
          throw new ValidationError('Vehicle plate number and type are required for driver registration');
        }

        const vehicle = UserFactory.createVehicle(
          params.vehicleType,
          params.plateNumber,
          params.vehicleModel || 'Standard',
          params.vehicleColor || 'White',
          params.vehicleYear || new Date().getFullYear()
        );

        return new Driver(
          params.id,
          params.name,
          params.email,
          params.passwordHash,
          params.phone,
          params.licenseNumber,
          vehicle
        );
      }

      case 'ADMIN': {
        return new Admin(
          params.id,
          params.name,
          params.email,
          params.passwordHash,
          params.phone,
          params.department || 'Operations'
        );
      }

      default:
        throw new ValidationError(`Unsupported user role: ${params.role}`);
    }
  }

  /**
   * Helper factory to instantiate concrete Vehicle subclass
   */
  public static createVehicle(
    type: VehicleCategory,
    plate: string,
    model: string,
    color: string,
    year?: number
  ): Vehicle {
    const rawType = String(type || '').trim().toUpperCase();
    const normalizedType: VehicleCategory =
      rawType === 'LUX' || rawType === 'PREMIUM_CAR' ? 'PREMIUM' : (rawType as VehicleCategory);

    switch (normalizedType) {
      case 'BIKE':
        return new Bike(plate, model, color, year);
      case 'AUTO':
        return new Auto(plate, model, color, year);
      case 'MINI':
        return new MiniCar(plate, model, color, year);
      case 'SEDAN':
        return new Sedan(plate, model, color, year);
      case 'SUV':
        return new SUV(plate, model, color, year);
      case 'PREMIUM':
        return new PremiumCar(plate, model, color, 4, year);
      default:
        throw new ValidationError(`Invalid vehicle category: ${type}`);
    }
  }
}

