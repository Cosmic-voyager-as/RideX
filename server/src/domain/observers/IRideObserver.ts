import { Ride, RideStatus } from '../rides/Ride';

/** OOP: Abstraction
 *  WHY: Observer interface establishing an event subscription contract so decoupled services (SocketBroadcaster, EarningsTracker, NotificationService) listen to ride state changes. */
export interface IRideObserver {
  getObserverName(): string;

  /**
   * POLYMORPHISM: Callback executed whenever the subject Ride transitions to a new lifecycle state
   */
  onRideStatusChanged(ride: Ride, oldStatus: RideStatus, newStatus: RideStatus): void;
}

