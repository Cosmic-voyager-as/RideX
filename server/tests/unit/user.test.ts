import { describe, it, expect } from 'vitest';
import { User } from '../../src/domain/User';
import { Customer } from '../../src/domain/Customer';
import { Driver } from '../../src/domain/Driver';
import { Admin } from '../../src/domain/Admin';
import { Wallet } from '../../src/domain/Wallet';
import { Sedan } from '../../src/domain/vehicles/Sedan';
import { ValidationError, UnauthorizedError } from '../../src/errors';

describe('OOP Showcase: User Hierarchy (Inheritance, Abstraction, Encapsulation)', () => {
  const dummyHasher = (p: string) => `hashed_${p}`;
  const dummyVerifier = (p: string, h: string) => h === `hashed_${p}`;

  it('ABSTRACTION: User is an abstract class and cannot be instantiated directly', () => {
    // ABSTRACTION: TypeScript compiler prevents direct instantiation:
    // @ts-expect-error TS2511: Cannot create an instance of an abstract class.
    expect(() => new User('u-1', 'Abstract', 'a@a.com', 'h123', '1234567890')).toThrow();
  });

  it('INHERITANCE: Customer extends User and inherits core identity while adding rider behavior', () => {
    const wallet = new Wallet('w-cust-1', 'cust-1', 100);
    const customer = new Customer(
      'cust-1',
      'Alice Rider',
      'alice@example.com',
      dummyHasher('secure123'),
      '+1234567890',
      wallet
    );

    // INHERITANCE: Inherited getters from abstract User
    expect(customer.getId()).toBe('cust-1');
    expect(customer.getName()).toBe('Alice Rider');
    expect(customer.getEmail()).toBe('alice@example.com');
    expect(customer.getPhone()).toBe('+1234567890');
    expect(customer instanceof User).toBe(true);

    // POLYMORPHISM: Specialized role and permissions
    expect(customer.getRole()).toBe('CUSTOMER');
    expect(customer.getDashboardPermissions()).toContain('book_ride');

    // Customer-specific state
    expect(customer.getWallet().getBalance()).toBe(100);
    customer.addSavedPlace({
      id: 'sp-1',
      name: 'Home',
      latitude: 40.7128,
      longitude: -74.006,
      address: '123 Broadway, NYC'
    });
    expect(customer.getSavedPlaces().length).toBe(1);
  });

  it('INHERITANCE: Driver extends User and specializes lifecycle and vehicle dispatch behavior', () => {
    const driver = new Driver(
      'drv-1',
      'Bob Transporter',
      'bob@example.com',
      dummyHasher('pwd123'),
      '+1987654321',
      'DL-NYC-98765'
    );

    // INHERITANCE: Inherited getters from abstract User
    expect(driver.getId()).toBe('drv-1');
    expect(driver.getName()).toBe('Bob Transporter');
    expect(driver instanceof User).toBe(true);

    // Driver-specific behavior
    expect(driver.getRole()).toBe('DRIVER');
    expect(driver.getStatus()).toBe('OFFLINE');

    // Business invariant: Cannot go online without vehicle and location
    expect(() => driver.goOnline()).toThrowError(ValidationError);

    const vehicle = new Sedan('NYC-1001', 'Toyota Camry', 'Silver');
    driver.assignVehicle(vehicle);
    driver.updateLocation(40.73061, -73.935242, 'Queens, NY');

    // Now driver can go online
    driver.goOnline();
    expect(driver.getStatus()).toBe('ONLINE');

    // Accept ride transition
    driver.acceptRide('ride-123');
    expect(driver.getStatus()).toBe('ON_TRIP');

    // Complete trip and accumulate earnings
    driver.completeTrip(35.5);
    expect(driver.getEarnings()).toBe(35.5);
    expect(driver.getStatus()).toBe('ONLINE');
  });

  it('INHERITANCE: Admin extends User and specializes system governance capabilities', () => {
    const admin = new Admin(
      'adm-1',
      'Carol Executive',
      'carol@ridex.com',
      dummyHasher('adminPass1'),
      '+1555000111',
      'Safety & Compliance'
    );

    expect(admin instanceof User).toBe(true);
    expect(admin.getRole()).toBe('ADMIN');
    expect(admin.getDepartment()).toBe('Safety & Compliance');
    expect(admin.getDashboardPermissions()).toContain('manage_users');
    expect(admin.manageUsers()).toContain('verify_driver_license');
  });

  it('ENCAPSULATION: toPublicJSON() never exposes passwordHash', () => {
    const wallet = new Wallet('w-2', 'cust-2', 50);
    const customer = new Customer(
      'cust-2',
      'Dave User',
      'dave@example.com',
      dummyHasher('supersecretpassword'),
      '+1122334455',
      wallet
    );

    const publicData = customer.toPublicJSON();
    expect(publicData).not.toHaveProperty('passwordHash');
    expect(publicData).not.toHaveProperty('_passwordHash');
    expect(JSON.stringify(publicData)).not.toContain('supersecretpassword');
    expect(JSON.stringify(publicData)).not.toContain('hashed_');
  });

  it('ENCAPSULATION: changePassword() enforces old password authentication and validation', () => {
    const wallet = new Wallet('w-3', 'cust-3', 10);
    const customer = new Customer(
      'cust-3',
      'Eve Rider',
      'eve@example.com',
      dummyHasher('oldSecret123'),
      '+1999888777',
      wallet
    );

    // Wrong current password
    expect(() =>
      customer.changePassword('wrongPassword', 'newSecret123', dummyHasher, dummyVerifier)
    ).toThrowError(UnauthorizedError);

    // Too short new password
    expect(() =>
      customer.changePassword('oldSecret123', 'short', dummyHasher, dummyVerifier)
    ).toThrowError(ValidationError);

    // Identical password
    expect(() =>
      customer.changePassword('oldSecret123', 'oldSecret123', dummyHasher, dummyVerifier)
    ).toThrowError(ValidationError);

    // Valid change
    customer.changePassword('oldSecret123', 'brandNewSecret456', dummyHasher, dummyVerifier);
    expect(customer.verifyPassword('brandNewSecret456', dummyVerifier)).toBe(true);
    expect(customer.verifyPassword('oldSecret123', dummyVerifier)).toBe(false);
  });

  it('ABSTRACTION: Customer can rate any driver conforming to IRateableDriver', () => {
    const wallet = new Wallet('w-4', 'cust-4', 100);
    const customer = new Customer(
      'cust-4',
      'Rider Frank',
      'frank@example.com',
      dummyHasher('riderPwd'),
      '+1234555666',
      wallet
    );

    const driver = new Driver(
      'drv-2',
      'Driver Dan',
      'dan@example.com',
      dummyHasher('drvPwd'),
      '+1999111222',
      'DL-NY-2222'
    );

    customer.rateDriver(driver, 5, 'Smooth ride!');
    customer.rateDriver(driver, 4, 'Polite driver');

    expect(driver.getRatingCount()).toBe(2);
    expect(driver.getRatingAverage()).toBe(4.5);
  });
});

