import { ValidationError, UnauthorizedError } from '../errors';

export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface SavedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

/** OOP: Abstraction, Inheritance, Encapsulation
 *  WHY: Serves as the abstract base class for all system actors, encapsulating core credentials and identity while enforcing role and authorization contracts. */
export abstract class User {
  // ENCAPSULATION: All identity attributes are private to prevent direct tampering
  private readonly _id: string;
  private _name: string;
  private _email: string;
  // ENCAPSULATION: passwordHash is private and never leaked through public interfaces
  private _passwordHash: string;
  private _phone: string | null;
  private readonly _createdAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    phone: string | null,
    createdAt: Date = new Date()
  ) {
    // ABSTRACTION: Runtime guard enforcing that abstract class cannot be instantiated directly
    if (new.target === User) {
      throw new Error('Cannot instantiate abstract class User directly');
    }

    if (!name || name.trim().length === 0) {
      throw new ValidationError('User name cannot be empty');
    }
    if (!email || !email.includes('@')) {
      throw new ValidationError(`Invalid email address: ${email}`);
    }
    if (!passwordHash) {
      throw new ValidationError('Password hash is required');
    }
    if (phone !== null && phone.trim().length < 7) {
  throw new ValidationError('Valid phone number must contain at least 7 characters');
}

    this._id = id;
    this._name = name.trim();
    this._email = email.trim().toLowerCase();
    this._passwordHash = passwordHash;
    this._phone = phone?.trim() || null;
    this._createdAt = createdAt;
  }

  // ENCAPSULATION: Read-only getters
  public getId(): string {
    return this._id;
  }

  public getName(): string {
    return this._name;
  }

  public setName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }
    this._name = name.trim();
  }

  public getEmail(): string {
    return this._email;
  }

  public getPhone(): string | null {
  return this._phone;
}

  public setPhone(phone: string): void {
    if (!phone || phone.trim().length < 7) {
      throw new ValidationError('Valid phone number is required (min 7 digits)');
    }
    this._phone = phone.trim();
  }

  public getCreatedAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  // ENCAPSULATION: Direct access to password hash is restricted to persistence layer mapping only
  public getPasswordHashForPersistence(): string {
    return this._passwordHash;
  }

  /**
   * Encapsulated password verification via injection of verifier function (e.g. bcrypt.compareSync)
   */
  public verifyPassword(
    plainText: string,
    verifier: (plain: string, hash: string) => boolean
  ): boolean {
    return verifier(plainText, this._passwordHash);
  }

  /**
   * Password change logic encapsulated inside User entity with validation rules
   */
  public changePassword(
    oldPasswordPlain: string,
    newPasswordPlain: string,
    hasher: (plain: string) => string,
    verifier: (plain: string, hash: string) => boolean
  ): void {
    // ENCAPSULATION: Enforce credential authentication prior to mutation
    if (!this.verifyPassword(oldPasswordPlain, verifier)) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (!newPasswordPlain || newPasswordPlain.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    if (oldPasswordPlain === newPasswordPlain) {
      throw new ValidationError('New password cannot be the same as the current password');
    }

    this._passwordHash = hasher(newPasswordPlain);
  }

  // ABSTRACTION: Force derived classes to declare their domain role
  public abstract getRole(): Role;

  // ABSTRACTION & POLYMORPHISM: Derived classes supply role-specific authorization permissions
  public abstract getDashboardPermissions(): string[];

  /**
   * Serializes user identity for public consumers.
   * Never leaks passwordHash.
   */
  public toPublicJSON(): Record<string, unknown> {
    // ENCAPSULATION: Exposes public contract while hiding internal passwordHash
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      phone: this._phone,
      role: this.getRole(),
      permissions: this.getDashboardPermissions(),
      createdAt: this._createdAt.toISOString()
    };
  }
}

