import { User, Role } from './User';
import { ValidationError } from '../errors';

/** OOP: Inheritance
 *  WHY: Specializes User with system-level administrative authorities, overriding permission contracts for operational control. */
export class Admin extends User {
  // ENCAPSULATION: Department classification is private to admin profile
  private _department: string;

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    phone: string,
    department: string = 'Operations',
    createdAt?: Date
  ) {
    // INHERITANCE: Delegates base user initialization to abstract User superclass
    super(id, name, email, passwordHash, phone, createdAt);

    if (!department || department.trim().length === 0) {
      throw new ValidationError('Department is required for administrator');
    }
    this._department = department.trim();
  }

  // ENCAPSULATION: Read-only department getter
  public getDepartment(): string {
    return this._department;
  }

  public setDepartment(department: string): void {
    if (!department || department.trim().length === 0) {
      throw new ValidationError('Department cannot be empty');
    }
    this._department = department.trim();
  }

  /**
   * System management capability for administrative users
   */
  public manageUsers(): string[] {
    return [
      'create_user',
      'ban_user',
      'verify_driver_license',
      'refund_transaction',
      'inspect_audit_logs'
    ];
  }

  /**
   * Analytics review capability for administrative users
   */
  public viewAnalytics(): Record<string, unknown> {
    return {
      department: this._department,
      systemStatus: 'HEALTHY',
      generatedAt: new Date().toISOString()
    };
  }

  // POLYMORPHISM: Specialization of abstract getRole contract
  public override getRole(): Role {
    return 'ADMIN';
  }

  // POLYMORPHISM: Specialization of abstract getDashboardPermissions contract
  public override getDashboardPermissions(): string[] {
    return [
      'manage_users',
      'view_analytics',
      'manage_vehicles',
      'manage_promo_codes',
      'system_audit',
      'override_dispatch'
    ];
  }

  public override toPublicJSON(): Record<string, unknown> {
    return {
      ...super.toPublicJSON(),
      department: this._department,
      adminCapabilities: this.manageUsers()
    };
  }
}

