import { IRideObserver } from './IRideObserver';
import { Ride, RideStatus } from '../rides/Ride';

/** OOP: Polymorphism, Abstraction
 *  WHY: Observer implementation calculating operational revenue splits (80% to driver, 20% platform fee) on trip completion without coupling to the Ride class. */
export class EarningsTrackerObserver implements IRideObserver {
  private _totalPlatformFeesCollected: number = 0.0;

  public getObserverName(): string {
    return 'EARNINGS_TRACKER';
  }

  public getPlatformFees(): number {
    return Math.round(this._totalPlatformFeesCollected * 100) / 100;
  }

  /**
   * POLYMORPHISM: Executes automatic 80/20 earnings split when status reaches COMPLETED
   */
  public onRideStatusChanged(ride: Ride, _oldStatus: RideStatus, newStatus: RideStatus): void {
    if (newStatus !== 'COMPLETED') return;

    const fare = ride.getFare();
    const driver = ride.getDriver();
    if (!fare || !driver) return;

    // 80% to driver, 20% platform fee
    const driverEarnings = Math.round(fare.total * 0.8 * 100) / 100;
    const platformFee = Math.round(fare.total * 0.2 * 100) / 100;

    this._totalPlatformFeesCollected += platformFee;

    // Note: Driver earnings state is updated polymorphically
    console.log(
      `[EarningsTracker] Ride ${ride.getId()} completed. Total: ₹${fare.total.toFixed(2)} | Driver (80%): ₹${driverEarnings.toFixed(2)} | Platform (20%): ₹${platformFee.toFixed(2)}`
    );
  }
}

