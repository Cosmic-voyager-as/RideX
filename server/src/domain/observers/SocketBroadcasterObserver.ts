import { IRideObserver } from './IRideObserver';
import { Ride, RideStatus } from '../rides/Ride';
import { Server as SocketIOServer } from 'socket.io';

/** OOP: Polymorphism, Abstraction
 *  WHY: Observer implementation publishing real-time WebSocket events across customer and driver tracking rooms upon ride state transitions. */
export class SocketBroadcasterObserver implements IRideObserver {
  private readonly _io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this._io = io;
  }

  public getObserverName(): string {
    return 'SOCKET_BROADCASTER';
  }

  /**
   * POLYMORPHISM: Broadcasts real-time events to Socket.IO rooms on state transition
   */
  public onRideStatusChanged(ride: Ride, oldStatus: RideStatus, newStatus: RideStatus): void {
    const payload = {
      rideId: ride.getId(),
      oldStatus,
      newStatus,
      status: newStatus,
      trackingToken: ride.getTrackingToken(),
      timestamp: new Date().toISOString()
    };

    // Emit to dedicated ride room
    this._io.to(`ride:${ride.getId()}`).emit('ride:statusChanged', payload);

    // Emit to public tracking room
    this._io.to(`track:${ride.getTrackingToken()}`).emit('ride:statusChanged', payload);

    if (newStatus === 'ACCEPTED') {
      this._io.to(`ride:${ride.getId()}`).emit('ride:accepted', {
        ...payload,
        driver: ride.getDriver() ? ride.getDriver()!.toPublicJSON() : null
      });
    } else if (newStatus === 'COMPLETED') {
      this._io.to(`ride:${ride.getId()}`).emit('ride:completed', {
        ...payload,
        fare: ride.getFare() ? ride.getFare()!.toJSON() : null
      });
    }
  }
}

