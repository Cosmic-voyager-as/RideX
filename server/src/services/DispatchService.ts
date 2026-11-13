import { Server as SocketIOServer } from 'socket.io';
import { IRepository } from '../repositories/IRepository';
import { User } from '../domain/User';
import { Driver } from '../domain/Driver';
import { Ride } from '../domain/rides/Ride';
import { IMatchingStrategy } from '../domain/matching/IMatchingStrategy';
import { NearestDriverStrategy } from '../domain/matching/NearestDriverStrategy';
import { Location } from '../domain/User';
import { ValidationError, NotFoundError } from '../errors';

export interface SOSAlert {
  id: string;
  rideId: string;
  triggeredBy: string;
  location: Location;
  timestamp: Date;
  status: 'ACTIVE' | 'RESOLVED';
  reason?: string;
}

/** OOP: Strategy Pattern, Abstraction
 *  WHY: Coordinates driver matching and real-time Socket.IO dispatching, depending solely on the IMatchingStrategy interface for polymorphic driver selection. */
export class DispatchService {
  private readonly _io: SocketIOServer;
  private readonly _userRepo: IRepository<User>;
  private readonly _rideRepo: IRepository<Ride>;
  // STRATEGY PATTERN: Injected matching algorithm, swappable at runtime by admin
  private _matchingStrategy: IMatchingStrategy;
  private readonly _sosAlerts: SOSAlert[] = [];
  // Active GPS simulation timer map: rideId -> timer
  private readonly _activeSimulations: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: SocketIOServer, userRepo: IRepository<User>, rideRepo: IRepository<Ride>) {
    this._io = io;
    this._userRepo = userRepo;
    this._rideRepo = rideRepo;
    this._matchingStrategy = new NearestDriverStrategy(); // Default strategy
  }

  // STRATEGY PATTERN: Runtime dynamic algorithm swapping
  public setMatchingStrategy(strategy: IMatchingStrategy): void {
    if (!strategy) {
      throw new ValidationError('Matching strategy is required');
    }
    this._matchingStrategy = strategy;
    console.log(`[DispatchService] Matching strategy switched to: ${strategy.getName()}`);
  }

  public getMatchingStrategy(): IMatchingStrategy {
    return this._matchingStrategy;
  }

  /**
   * Matches top available drivers and issues ride:offer with 15-second countdown
   */
  public dispatchRide(ride: Ride): Driver[] {
    const allUsers = this._userRepo.findAll();
    let availableDrivers = allUsers.filter(
      (u): u is Driver => u instanceof Driver && u.getStatus() === 'ONLINE'
    );

    // Fallback: If no drivers are currently online in dev/demo environment, activate seeded drivers
    if (availableDrivers.length === 0) {
      const allDrivers = allUsers.filter((u): u is Driver => u instanceof Driver);
      allDrivers.forEach((d) => d.goOnline());
      availableDrivers = allDrivers;
    }

    // POLYMORPHISM: Algorithm executes findDriver via the currently active strategy
    const matchedDrivers = this._matchingStrategy.findDriver(
      {
        rideId: ride.getId(),
        pickup: ride.getPickupLocation(),
        vehicleCategory: ride.getVehicle().getVehicleType()
      },
      availableDrivers
    );

    // Offer to top 3 matched drivers (or available drivers)
    const topOffers = matchedDrivers.length > 0 ? matchedDrivers.slice(0, 3) : availableDrivers.slice(0, 3);

    topOffers.forEach((driver, index) => {
      // Emit ride:offer to driver personal room with 15s expiration
      this._io.to(`driver:${driver.getId()}`).emit('ride:offer', {
        ride: ride.toJSON(),
        priorityIndex: index + 1,
        expiresInSeconds: 15,
        matchingStrategy: this._matchingStrategy.getName()
      });
    });

    // Notify ride room that ride is requested and search is actively underway
    this._io.to(`ride:${ride.getId()}`).emit('ride:requested', {
      rideId: ride.getId(),
      matchedCount: topOffers.length,
      matchingStrategy: this._matchingStrategy.getName()
    });

    // DEMO & RELIABILITY AUTO-ACCEPT:
    // If no manual driver accepts the ride within 3.5 seconds, auto-assign top matched driver so the customer screen transitions from REQUESTED -> ACCEPTED
    setTimeout(() => {
      const currentRide = this._rideRepo.findById(ride.getId());
      if (currentRide && currentRide.getStatus() === 'REQUESTED') {
        const primaryDriver = topOffers[0] || availableDrivers[0];
        if (primaryDriver) {
          console.log(`[DispatchService] Auto-assigning matched driver ${primaryDriver.getName()} for ride ${ride.getId()}`);
          this.acceptRideForDriver(primaryDriver.getId(), ride.getId());
        }
      }
    }, 3500);

    return topOffers;
  }

  /**
   * Accepts ride on behalf of driver and broadcasts confirmed status to all sockets
   */
  public acceptRideForDriver(driverId: string, rideId: string): Ride {
    const driver = this._userRepo.findById(driverId);
    const ride = this._rideRepo.findById(rideId);
    if (!ride || !driver || !(driver instanceof Driver)) {
      throw new NotFoundError(`Ride or Driver not found for acceptance`);
    }

    if (ride.getStatus() === 'REQUESTED') {
      ride.accept(driver);
      this._rideRepo.save(ride);
      this._userRepo.save(driver);
    }

    this.broadcastRideStatusChanged(ride, 'ACCEPTED', driver);
    this.startGpsSimulation(ride);
    return ride;
  }

  /**
   * Broadcasts real-time ride state transitions over Socket.IO to ride room and participants
   */
  public broadcastRideStatusChanged(ride: Ride, status: string, driver?: Driver): void {
    const d = driver || ride.getDriver();
    const payload = {
      rideId: ride.getId(),
      status,
      driverId: d ? d.getId() : null,
      driverName: d ? d.getName() : 'Manoj Reddy',
      driverPhone: d ? d.getPhone() : '+91 98765 43204',
      driverRating: d ? d.getRatingAverage() : 4.9,
      vehicleCategory: d?.getVehicle()?.getVehicleType() || ride.getVehicle().getVehicleType(),
      vehicleModel: d?.getVehicle()?.getModel() || 'Honda City',
      vehiclePlate: d?.getVehicle()?.getPlateNumber() || 'KA-04-SD-4444',
      vehicleColor: d?.getVehicle()?.getColor() || 'Pure White',
      otp: ride.getOtp(),
      trackingToken: ride.getTrackingToken(),
      timestamp: new Date().toISOString()
    };

    // Broadcast to ride room (Customer & Driver)
    this._io.to(`ride:${ride.getId()}`).emit('ride:statusChanged', payload);
    this._io.to(`ride:${ride.getId()}`).emit('ride:accepted', payload);

    // Broadcast to public tracking room
    this._io.to(`track:${ride.getTrackingToken()}`).emit('ride:statusChanged', payload);

    // If driver room is available, notify driver
    if (d) {
      this._io.to(`driver:${d.getId()}`).emit('ride:statusChanged', payload);
    }
  }

  /**
   * Real-Time Road GPS Navigation Simulation via OSRM Engine
   * Steps the vehicle along actual city streets, turns, and highways with road-bearing orientation
   */
  public async startGpsSimulation(ride: Ride): Promise<void> {
    const rideId = ride.getId();
    if (this._activeSimulations.has(rideId)) {
      clearInterval(this._activeSimulations.get(rideId)!);
      this._activeSimulations.delete(rideId);
    }

    const driver = ride.getDriver();
    if (!driver) return;

    const startLoc = ride.getPickupLocation();
    const endLoc = ride.getDropoffLocation();

    // Immediately position driver at pickup
    driver.updateLocation(startLoc.latitude, startLoc.longitude, 'At Pickup Location');
    this._userRepo.save(driver);

    const initialPayload = {
      rideId,
      driverId: driver.getId(),
      latitude: startLoc.latitude,
      longitude: startLoc.longitude,
      bearing: 0,
      speedKmH: 0,
      status: ride.getStatus()
    };
    this._io.to(`ride:${rideId}`).emit('driver:location', initialPayload);
    this._io.to(`track:${ride.getTrackingToken()}`).emit('driver:location', initialPayload);
    this._io.emit('driver_moved', { driverId: driver.getId(), lat: startLoc.latitude, lng: startLoc.longitude });

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLoc.longitude},${startLoc.latitude};${endLoc.longitude},${endLoc.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      if (!res.ok) return;
      const data: any = await res.json();
      if (!data.routes || !data.routes[0] || !data.routes[0].geometry) return;

      const rawCoords: [number, number][] = data.routes[0].geometry.coordinates; // [lng, lat]
      if (rawCoords.length < 2) return;

      // Sample ~25 evenly spaced road waypoints along real streets
      const stepCount = Math.min(25, rawCoords.length);
      const sampledWaypoints: Array<{ lat: number; lng: number; bearing: number }> = [];

      for (let i = 0; i < stepCount; i++) {
        const index = Math.round((i / (stepCount - 1)) * (rawCoords.length - 1));
        const [lng, lat] = rawCoords[index];
        const nextIndex = Math.min(rawCoords.length - 1, index + 1);
        const [nextLng, nextLat] = rawCoords[nextIndex];

        // Compute road-following bearing angle
        const dLon = ((nextLng - lng) * Math.PI) / 180;
        const y = Math.sin(dLon) * Math.cos((nextLat * Math.PI) / 180);
        const x =
          Math.cos((lat * Math.PI) / 180) * Math.sin((nextLat * Math.PI) / 180) -
          Math.sin((lat * Math.PI) / 180) * Math.cos((nextLat * Math.PI) / 180) * Math.cos(dLon);
        const bearing = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);

        sampledWaypoints.push({ lat, lng, bearing });
      }

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= sampledWaypoints.length) {
          this.stopGpsSimulation(rideId);
          console.log(`[DispatchService] Ride ${rideId} reached destination on road network`);
          return;
        }

        const point = sampledWaypoints[currentStep];
        driver.updateLocation(point.lat, point.lng, 'En Route on Road');
        this._userRepo.save(driver);

        const progressPct = Math.round((currentStep / (sampledWaypoints.length - 1)) * 100);
        const payload = {
          rideId,
          driverId: driver.getId(),
          latitude: point.lat,
          longitude: point.lng,
          progress: progressPct,
          bearing: point.bearing,
          speedKmH: Math.round(30 + Math.random() * 10),
          status: ride.getStatus()
        };

        this._io.to(`ride:${rideId}`).emit('driver:location', payload);
        this._io.to(`track:${ride.getTrackingToken()}`).emit('driver:location', payload);
        this._io.emit('driver_moved', { driverId: driver.getId(), lat: point.lat, lng: point.lng });
      }, 1500);

      this._activeSimulations.set(rideId, timer);
    } catch (err) {
      console.warn('[DispatchService] OSRM road simulation fallback:', err);
    }
  }

  public stopGpsSimulation(rideId: string): void {
    if (this._activeSimulations.has(rideId)) {
      clearInterval(this._activeSimulations.get(rideId)!);
      this._activeSimulations.delete(rideId);
    }
  }

  /**
   * SAFETY FEATURE: Triggers emergency SOS alert visible to administration
   */
  public triggerSos(rideId: string, triggeredBy: string, reason: string = 'Passenger emergency'): SOSAlert {
    const ride = this._rideRepo.findById(rideId);
    if (!ride) {
      throw new NotFoundError(`Ride with ID ${rideId} not found`);
    }

    const alert: SOSAlert = {
      id: `sos-${Date.now()}`,
      rideId,
      triggeredBy,
      location: ride.getDriver()?.getCurrentLocation() || ride.getPickupLocation(),
      timestamp: new Date(),
      status: 'ACTIVE',
      reason
    };

    this._sosAlerts.unshift(alert);

    // Broadcast emergency alert immediately to admin room and ride room
    this._io.emit('sos:triggered', alert);
    console.warn(`🚨 [EMERGENCY SOS TRIGGERED] Ride: ${rideId} by ${triggeredBy}. Location:`, alert.location);

    return alert;
  }

  public getSosAlerts(): readonly SOSAlert[] {
    return Object.freeze([...this._sosAlerts]);
  }
}

