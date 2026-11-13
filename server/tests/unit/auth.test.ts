import { describe, it, expect } from 'vitest';
import { AuthService } from '../../src/services/AuthService';
import { AuthController } from '../../src/controllers/AuthController';
import { IRepository } from '../../src/repositories/IRepository';
import { User } from '../../src/domain/User';
import { ValidationError, UnauthorizedError } from '../../src/errors';

// In-Memory mock implementation of IRepository<User> showcasing Abstraction
class MockUserRepository implements IRepository<User> {
  private users: Map<string, User> = new Map();

  public findById(id: string): User | null {
    return this.users.get(id) || null;
  }

  public findAll(): User[] {
    return Array.from(this.users.values());
  }

  public save(user: User): void {
    this.users.set(user.getId(), user);
  }

  public delete(id: string): void {
    this.users.delete(id);
  }
}

describe('OOP Showcase: AuthService (Abstraction & Security)', () => {
  const userRepo = new MockUserRepository();
  const authService = new AuthService(userRepo);

  it('ABSTRACTION: AuthService registers customer and issues JWT using IRepository contract', () => {
    const result = authService.register({
      name: 'Pooja Hegde',
      email: 'pooja@example.in',
      password: 'password123',
      phone: '+919876543201',
      role: 'CUSTOMER'
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('pooja@example.in');
    expect(result.user.role).toBe('CUSTOMER');
    expect(result.token).toBeDefined();

    // Verify token claims
    const claims = authService.verifyToken(result.token);
    expect(claims.email).toBe('pooja@example.in');
    expect(claims.role).toBe('CUSTOMER');
  });

  it('ABSTRACTION: AuthService registers driver with vehicle specification', () => {
    const result = authService.register({
      name: 'Ramesh Pilot',
      email: 'ramesh@example.in',
      password: 'driverPassword1',
      phone: '+919876543202',
      role: 'DRIVER',
      licenseNumber: 'DL-IND-888',
      vehicleType: 'SEDAN',
      plateNumber: 'KA-05-MM-1234',
      vehicleModel: 'Honda City'
    });

    expect(result.user.role).toBe('DRIVER');
    expect(result.user.licenseNumber).toBe('DL-IND-888');
    expect(result.token).toBeDefined();
  });

  it('ENCAPSULATION: login validates bcrypt password and returns token', () => {
    const loginResult = authService.login('pooja@example.in', 'password123');

    expect(loginResult.user.name).toBe('Pooja Hegde');
    expect(loginResult.token).toBeDefined();
  });

  it('ENCAPSULATION: login rejects wrong password with UnauthorizedError', () => {
    expect(() => authService.login('pooja@example.in', 'wrongPassword')).toThrowError(
      UnauthorizedError
    );
  });

  it('login rejects non-existent email with UnauthorizedError', () => {
    expect(() => authService.login('nonexistent@example.in', 'password123')).toThrowError(
      UnauthorizedError
    );
  });

  it('register rejects duplicate email address with ValidationError', () => {
    expect(() =>
      authService.register({
        name: 'Duplicate Pooja',
        email: 'pooja@example.in',
        password: 'password123',
        phone: '+919876543999',
        role: 'CUSTOMER'
      })
    ).toThrowError(ValidationError);
  });

  it('GOOGLE SSO: logs in or automatically provisions customer via Google profile', () => {
    // 1. First time Google login provisions user
    const googleResult = authService.googleLogin({
      email: 'sundar.pichai@gmail.com',
      name: 'Sundar Pichai',
      googleId: 'g-123456789'
    });

    expect(googleResult.user).toBeDefined();
    expect(googleResult.user.email).toBe('sundar.pichai@gmail.com');
    expect(googleResult.user.name).toBe('Sundar Pichai');
    expect(googleResult.user.role).toBe('CUSTOMER');
    expect(googleResult.token).toBeDefined();

    // 2. Subsequent Google login authenticates existing customer
    const returningResult = authService.googleLogin({
      email: 'sundar.pichai@gmail.com',
      name: 'Sundar Pichai'
    });

    expect(returningResult.user.id).toBe(googleResult.user.id);
    expect(returningResult.token).toBeDefined();
  });

  it('CONTROLLER: AuthController.googleLogin verifies and logs in user, returning 200 with JWT', async () => {
    const controller = new AuthController(authService);

    // Create a mock Google JWT payload
    const payload = {
      iss: 'https://accounts.google.com',
      email: 'alex.rider@google.com',
      name: 'Alex Rider',
      sub: 'google-sub-98765',
      email_verified: true
    };
    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const mockGoogleJwt = `header.${b64}.signature`;

    let statusCode = 0;
    let jsonBody: any = null;

    const mockReq: any = {
      body: { credential: mockGoogleJwt }
    };
    const mockRes: any = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        jsonBody = data;
        return mockRes;
      }
    };
    const mockNext = () => {};

    await controller.googleLogin(mockReq, mockRes, mockNext);

    expect(statusCode).toBe(200);
    expect(jsonBody.status).toBe('SUCCESS');
    expect(jsonBody.data.user.email).toBe('alex.rider@google.com');
    expect(jsonBody.data.user.role).toBe('CUSTOMER');
    expect(jsonBody.data.token).toBeDefined();
  });
});

