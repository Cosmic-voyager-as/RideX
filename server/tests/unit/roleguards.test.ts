import { describe, it, expect } from 'vitest';
import { createAuthMiddleware } from '../../src/middleware/authMiddleware';
import { Customer } from '../../src/domain/Customer';
import { Driver } from '../../src/domain/Driver';
import { Admin } from '../../src/domain/Admin';
import { Wallet } from '../../src/domain/Wallet';
import { ForbiddenError, UnauthorizedError } from '../../src/errors';
import { Request, Response } from 'express';

describe('OOP Showcase: Role Guards & Authorization (Polymorphism & Abstraction)', () => {
  const dummyAuthService = {} as any;
  const dummyUserRepo = {} as any;
  const { authorize } = createAuthMiddleware(dummyAuthService, dummyUserRepo);

  const customer = new Customer(
    'c-1',
    'Customer Test',
    'c@ridex.com',
    'hash',
    '+919999999991',
    new Wallet('w-1', 'c-1', 100)
  );

  const driver = new Driver(
    'd-1',
    'Driver Test',
    'd@ridex.com',
    'hash',
    '+919999999992',
    'DL-TEST-123'
  );

  const admin = new Admin(
    'a-1',
    'Admin Test',
    'a@ridex.com',
    'hash',
    '+919999999993',
    'Operations'
  );

  const mockRes = {} as Response;

  it('POLYMORPHISM: authorize permits request when User.getRole() matches allowed role', () => {
    let nextCalled = false;
    const req = { user: customer } as Request;
    const next = () => {
      nextCalled = true;
    };

    // User.getRole() === 'CUSTOMER' -> allowed
    authorize('CUSTOMER')(req, mockRes, next);
    expect(nextCalled).toBe(true);
  });

  it('POLYMORPHISM: customer attempting to access driver endpoint is rejected with ForbiddenError (403)', () => {
    const req = { user: customer } as Request;
    const next = () => {};

    // Customer attempting to call driver endpoint
    expect(() => authorize('DRIVER')(req, mockRes, next)).toThrowError(ForbiddenError);

    try {
      authorize('DRIVER')(req, mockRes, next);
    } catch (err: any) {
      // Proves 403 status code
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain("Forbidden: Endpoint requires role [DRIVER]. Current role is 'CUSTOMER'");
    }
  });

  it('POLYMORPHISM: driver attempting to access admin or customer endpoints is rejected with 403', () => {
    const req = { user: driver } as Request;
    const next = () => {};

    // Driver attempting to call admin endpoint
    expect(() => authorize('ADMIN')(req, mockRes, next)).toThrowError(ForbiddenError);

    // Driver attempting to call customer-only endpoint
    expect(() => authorize('CUSTOMER')(req, mockRes, next)).toThrowError(ForbiddenError);
  });

  it('POLYMORPHISM: admin attempting to access customer or driver endpoints is rejected with 403', () => {
    const req = { user: admin } as Request;
    const next = () => {};

    expect(() => authorize('CUSTOMER')(req, mockRes, next)).toThrowError(ForbiddenError);
    expect(() => authorize('DRIVER')(req, mockRes, next)).toThrowError(ForbiddenError);
  });

  it('unauthenticated request without req.user throws UnauthorizedError (401)', () => {
    const req = { user: undefined } as Request;
    const next = () => {};

    expect(() => authorize('CUSTOMER')(req, mockRes, next)).toThrowError(UnauthorizedError);

    try {
      authorize('CUSTOMER')(req, mockRes, next);
    } catch (err: any) {
      expect(err.statusCode).toBe(401);
    }
  });
});

