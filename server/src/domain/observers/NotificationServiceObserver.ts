import { IRideObserver } from './IRideObserver';
import { Ride, RideStatus } from '../rides/Ride';

export interface AuditNotification {
  id: string;
  rideId: string;
  message: string;
  timestamp: Date;
}

/** OOP: Polymorphism, Abstraction
 *  WHY: Observer implementation logging lifecycle events and audit trails upon state changes. */
export class NotificationServiceObserver implements IRideObserver {
  private readonly _logs: AuditNotification[] = [];

  public getObserverName(): string {
    return 'NOTIFICATION_SERVICE';
  }

  public getLogs(): readonly AuditNotification[] {
    return Object.freeze([...this._logs]);
  }

  public onRideStatusChanged(ride: Ride, oldStatus: RideStatus, newStatus: RideStatus): void {
    const log: AuditNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      rideId: ride.getId(),
      message: `Ride ${ride.getId()} transitioned from ${oldStatus} to ${newStatus}`,
      timestamp: new Date()
    };
    this._logs.push(log);
  }
}

