import { describe, it, expect } from 'vitest';
import { UserFactory } from '../../src/domain/UserFactory';
import { Customer } from '../../src/domain/Customer';
import { Driver } from '../../src/domain/Driver';
import { Admin } from '../../src/domain/Admin';
import { Sedan } from '../../src/domain/vehicles/Sedan';
import { Bike } from '../../src/domain/vehicles/Bike';
import { ValidationError } from '../../src/errors';

describe('OOP Showcase: UserFactory (Factory Pattern & Abstraction)', () => {
  it('FACTORY PATTERN: creates Customer with encapsulated Wallet without caller knowing concrete classes', () => {
    const user = UserFactory.createUser({
      id: 'cust-f1',
      name: 'Aditi Rao',
      email: 'aditi@example.in',
      passwordHash: 'hash_123',
      phone: '+919876500111',
      role: 'CUSTOMER',
      initialWalletBalance: 500.0
    });

    expect(user instanceof Customer).toBe(true);
    expect(user.getRole()).toBe('CUSTOMER');

    const customer = user as Customer;
    expect(customer.getWallet()).toBeDefined();
    expect(customer.getWallet().getBalance()).toBe(500.0);
  });

  it('FACTORY PATTERN: creates Driver with assigned Vehicle from parameters', () => {
    const user = UserFactory.createUser({
      id: 'drv-f1',
      name: 'Mohit Sharma',
      email: 'mohit@example.in',
      passwordHash: 'hash_456',
      phone: '+919876500222',
      role: 'DRIVER',
      licenseNumber: 'DL-KA-2026-999',
      vehicleType: 'SEDAN',
      plateNumber: 'KA-01-AB-1234',
      vehicleModel: 'Honda City',
      vehicleColor: 'Pearl White'
    });

    expect(user instanceof Driver).toBe(true);
    expect(user.getRole()).toBe('DRIVER');

    const driver = user as Driver;
    expect(driver.getLicenseNumber()).toBe('DL-KA-2026-999');
    expect(driver.getVehicle()).toBeDefined();
    expect(driver.getVehicle() instanceof Sedan).toBe(true);
    expect(driver.getVehicle()?.getPlateNumber()).toBe('KA-01-AB-1234');
  });

  it('FACTORY PATTERN: creates Admin with department metadata', () => {
    const user = UserFactory.createUser({
      id: 'adm-f1',
      name: 'Super Admin',
      email: 'superadmin@ridex.com',
      passwordHash: 'hash_admin',
      phone: '+919876500333',
      role: 'ADMIN',
      department: 'Fraud Investigation'
    });

    expect(user instanceof Admin).toBe(true);
    expect(user.getRole()).toBe('ADMIN');
    expect((user as Admin).getDepartment()).toBe('Fraud Investigation');
  });

  it('FACTORY PATTERN: createVehicle instantiates correct polymorphic vehicle subclasses', () => {
    const bike = UserFactory.createVehicle('BIKE', 'KA-01-B', 'Yamaha', 'Black');
    const sedan = UserFactory.createVehicle('SEDAN', 'KA-01-S', 'Camry', 'Silver');

    expect(bike instanceof Bike).toBe(true);
    expect(bike.getSeatingCapacity()).toBe(1);

    expect(sedan instanceof Sedan).toBe(true);
    expect(sedan.getSeatingCapacity()).toBe(4);
  });

  it('FACTORY PATTERN: throws ValidationError on missing driver credentials', () => {
    expect(() =>
      UserFactory.createUser({
        id: 'drv-err',
        name: 'Incomplete Driver',
        email: 'inc@example.in',
        passwordHash: 'h',
        phone: '+9199999999',
        role: 'DRIVER'
      })
    ).toThrowError(ValidationError);
  });
});

