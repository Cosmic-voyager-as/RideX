import { Role } from '../types';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/** OOP: Abstraction & Polymorphism
 *  WHY: RoleConfig is an abstract class defining UI layout characteristics, theme colors,
 *  and navigation items polymorphically resolved for Customer, Driver, and Admin roles. */
export abstract class RoleConfig {
  constructor() {
    // ABSTRACTION: Prevent direct instantiation of abstract RoleConfig
    if (new.target === RoleConfig) {
      throw new Error('Cannot instantiate abstract class RoleConfig directly');
    }
  }

  // POLYMORPHISM: Contract methods overridden by subclasses
  public abstract getRole(): Role;
  public abstract getDisplayName(): string;
  public abstract getThemeColor(): string; // Primary hex
  public abstract getAccentColor(): string; // Background / hover tint
  public abstract getBadgeColor(): string; // Badge chip CSS
  public abstract getMenuItems(): MenuItem[];
  public abstract getWelcomeMessage(userName: string): string;
}

/** OOP: Inheritance & Polymorphism
 *  WHY: CustomerRoleConfig specializes customer styling (emerald theme) and customer action tabs. */
export class CustomerRoleConfig extends RoleConfig {
  public override getRole(): Role {
    return 'CUSTOMER';
  }

  public override getDisplayName(): string {
    return 'Rider / Customer';
  }

  // POLYMORPHISM: Emerald green theme
  public override getThemeColor(): string {
    return '#10b981';
  }

  public override getAccentColor(): string {
    return '#ecfdf5';
  }

  public override getBadgeColor(): string {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }

  public override getMenuItems(): MenuItem[] {
    return [
      { id: 'book', label: 'Book a Ride', icon: '📍', description: 'Estimate fares and request rides' },
      { id: 'rides', label: 'My Rides', icon: '🚗', description: 'View current trip and history' },
      { id: 'wallet', label: 'RideX Wallet', icon: '💳', description: 'Manage credits and top-up' },
      { id: 'places', label: 'Saved Places', icon: '⭐', description: 'Home, work, and favorites' }
    ];
  }

  public override getWelcomeMessage(userName: string): string {
    return `Welcome back, ${userName}! Ready for your next journey?`;
  }
}

/** OOP: Inheritance & Polymorphism
 *  WHY: DriverRoleConfig specializes driver styling (amber gold theme) and driver fleet operations. */
export class DriverRoleConfig extends RoleConfig {
  public override getRole(): Role {
    return 'DRIVER';
  }

  public override getDisplayName(): string {
    return 'Partner Driver';
  }

  // POLYMORPHISM: Amber/Gold theme
  public override getThemeColor(): string {
    return '#f59e0b';
  }

  public override getAccentColor(): string {
    return '#fffbeb';
  }

  public override getBadgeColor(): string {
    return 'bg-amber-100 text-amber-800 border-amber-300';
  }

  public override getMenuItems(): MenuItem[] {
    return [
      { id: 'dispatch', label: 'Live Dispatch', icon: '⚡', description: 'Incoming requests & status' },
      { id: 'active', label: 'Active Trip', icon: '🧭', description: 'Turn-by-turn OTP navigation' },
      { id: 'earnings', label: 'My Earnings', icon: '💰', description: 'Daily fares and 80% splits' },
      { id: 'vehicle', label: 'Vehicle Profile', icon: '🚘', description: 'Inspection and license data' }
    ];
  }

  public override getWelcomeMessage(userName: string): string {
    return `Captain ${userName}, your vehicle is registered and ready for duty.`;
  }
}

/** OOP: Inheritance & Polymorphism
 *  WHY: AdminRoleConfig specializes governance styling (indigo theme) and fleet-wide controls. */
export class AdminRoleConfig extends RoleConfig {
  public override getRole(): Role {
    return 'ADMIN';
  }

  public override getDisplayName(): string {
    return 'Platform Operations Admin';
  }

  // POLYMORPHISM: Indigo/Purple theme
  public override getThemeColor(): string {
    return '#6366f1';
  }

  public override getAccentColor(): string {
    return '#eef2ff';
  }

  public override getBadgeColor(): string {
    return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  }

  public override getMenuItems(): MenuItem[] {
    return [
      { id: 'overview', label: 'Analytics & KPIs', icon: '📊', description: 'Platform revenue and stats' },
      { id: 'strategy', label: 'Dispatch & Surge', icon: '⚙️', description: 'Runtime Strategy swapper' },
      { id: 'users', label: 'User Governance', icon: '👥', description: 'Supervise riders and drivers' },
      { id: 'rides', label: 'Ride Audits', icon: '📋', description: 'Inspect full state machine transitions' },
      { id: 'sos', label: 'Emergency SOS', icon: '🚨', description: 'High-priority distress alerts' }
    ];
  }

  public override getWelcomeMessage(userName: string): string {
    return `Commander ${userName}, system metrics and dispatch strategies are operational.`;
  }
}

/** OOP: Factory Pattern
 *  WHY: Factory resolves concrete RoleConfig subclass polymorphically from the User's role token. */
export class RoleConfigFactory {
  public static getConfig(role: Role): RoleConfig {
    switch (role) {
      case 'CUSTOMER':
        return new CustomerRoleConfig();
      case 'DRIVER':
        return new DriverRoleConfig();
      case 'ADMIN':
        return new AdminRoleConfig();
      default:
        return new CustomerRoleConfig();
    }
  }
}

