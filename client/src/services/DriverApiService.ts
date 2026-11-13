import { BaseApiService } from './BaseApiService';
import { Location, RideData } from '../types';

/** OOP: Inheritance
 *  WHY: DriverApiService inherits BaseApiService infrastructure and specializes
 *  all driver domain operations (availability toggling, active requests, OTP trip lifecycle, earnings). */
export class DriverApiService extends BaseApiService {
  constructor() {
    super('/api');
  }

  public async setStatus(status: 'ONLINE' | 'OFFLINE'): Promise<{ status: string }> {
    return this.request<{ status: string }>('/driver/status', {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  public async updateLocation(latitude: number, longitude: number, address?: string): Promise<Location> {
    return this.request<Location>('/driver/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, address })
    });
  }

  public async getRequests(): Promise<RideData[]> {
    return this.request<RideData[]>('/driver/requests');
  }

  public async acceptRide(rideId: string): Promise<RideData> {
    return this.request<RideData>(`/driver/rides/${rideId}/accept`, {
      method: 'POST'
    });
  }

  public async arriveAtPickup(rideId: string): Promise<RideData> {
    return this.request<RideData>(`/driver/rides/${rideId}/arrive`, {
      method: 'POST'
    });
  }

  public async startTripWithOtp(rideId: string, otp: string): Promise<RideData> {
    return this.request<RideData>(`/driver/rides/${rideId}/start`, {
      method: 'POST',
      body: JSON.stringify({ otp })
    });
  }

  public async completeTrip(rideId: string): Promise<RideData> {
    return this.request<RideData>(`/driver/rides/${rideId}/complete`, {
      method: 'POST'
    });
  }

  public async getEarnings(): Promise<{
    earnings: number;
    completedTrips: number;
    ratingAverage: number;
    ratingCount: number;
    status: string;
  }> {
    return this.request('/driver/earnings');
  }
}

export const driverApi = new DriverApiService();

