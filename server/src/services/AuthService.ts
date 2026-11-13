import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IRepository } from '../repositories/IRepository';
import { User, Role } from '../domain/User';
import { UserFactory } from '../domain/UserFactory';
import { VehicleCategory } from '../domain/Vehicle';
import { ValidationError, UnauthorizedError } from '../errors';

const JWT_SECRET = process.env.JWT_SECRET || 'ridex-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = '7d';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
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

export interface AuthPayload {
  id: string;
  email: string;
  role: Role;
}

/** OOP: Abstraction, Encapsulation
 *  WHY: Encapsulates authentication workflows and credential hashing while depending strictly on the IRepository<User> abstraction for user persistence. */
export class AuthService {
  // ABSTRACTION: Inversion of Control via IRepository contract
  private readonly _userRepo: IRepository<User>;

  constructor(userRepo: IRepository<User>) {
    this._userRepo = userRepo;
  }

  /**
   * Registers a new user polymorphically via UserFactory
   */
  public register(dto: RegisterDTO): { user: Record<string, unknown>; token: string } {
    if (!dto.email || !dto.password) {
      throw new ValidationError('Email and password are required');
    }

    // Check if email already registered
    const allUsers = this._userRepo.findAll();
    const existing = allUsers.find((u) => u.getEmail() === dto.email.trim().toLowerCase());
    if (existing) {
      throw new ValidationError(`User with email '${dto.email}' already exists`);
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(dto.password, salt);

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // FACTORY PATTERN: Delegates instantiation to UserFactory
    const newUser = UserFactory.createUser({
      id: userId,
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      role: dto.role,
      licenseNumber: dto.licenseNumber,
      vehicleType: dto.vehicleType || (dto as any).vehicleCategory,
      plateNumber: dto.plateNumber,
      vehicleModel: dto.vehicleModel || (dto as any).model || 'Standard',
      vehicleColor: dto.vehicleColor || (dto as any).color || 'White',
      vehicleYear: dto.vehicleYear || new Date().getFullYear(),
      department: dto.department
    });

    this._userRepo.save(newUser);

    const token = this.generateToken(newUser);
    return {
      user: newUser.toPublicJSON(),
      token
    };
  }

  /**
   * Authenticates user credentials via domain's verifyPassword() method
   */
  public login(email: string, passwordPlain: string): { user: Record<string, unknown>; token: string } {
    if (!email || !passwordPlain) {
      throw new ValidationError('Email and password are required');
    }

    const allUsers = this._userRepo.findAll();
    const user = allUsers.find((u) => u.getEmail() === email.trim().toLowerCase());

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // ENCAPSULATION: Uses User entity's verifyPassword method with bcrypt verifier callback
    const isMatch = user.verifyPassword(passwordPlain, (plain, hash) =>
      bcrypt.compareSync(plain, hash)
    );

    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);
    return {
      user: user.toPublicJSON(),
      token
    };
  }

  /**
   * Authenticates or provisions a rider using Google OAuth profile
   */
  public googleLogin(dto: {
    email: string;
    name: string;
    googleId?: string;
    picture?: string;
  }): { user: Record<string, unknown>; token: string } {
    if (!dto.email) {
      throw new ValidationError('Google account email is required');
    }

    const emailClean = dto.email.trim().toLowerCase();
    const allUsers = this._userRepo.findAll();
    let user = allUsers.find((u) => u.getEmail() === emailClean);

    if (!user) {
      // Provision verified Google account as Customer
      const userId = `usr-g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const randomPasswordHash = bcrypt.hashSync(`google-auth-${Date.now()}-${Math.random()}`, 10);
      const displayName =
        dto.name && dto.name.trim().length > 0
          ? dto.name.trim()
          : emailClean.split('@')[0].replace(/[._]/g, ' ');

      user = UserFactory.createUser({
        id: userId,
        name: displayName,
        email: emailClean,
        passwordHash: randomPasswordHash,
        phone: '+919876543210',
        role: 'CUSTOMER',
        initialWalletBalance: 500
      });

      this._userRepo.save(user);
    }

    const token = this.generateToken(user);
    return {
      user: user.toPublicJSON(),
      token
    };
  }

  public generateToken(user: User): string {
    const payload: AuthPayload = {
      id: user.getId(),
      email: user.getEmail(),
      role: user.getRole()
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  public verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  }
}
