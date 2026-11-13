import { BaseApiService } from './BaseApiService';
import { RideData, UserProfile } from '../types';

export interface AdminAnalytics {
  users: { total: number; customers: number; drivers: number; admins: number };
  rides: { total: number; completed: number; active: number; cancelled: number };
  financials: { totalPlatformGrossFare: number; estimatedPlatformRevenue: number };
}

export interface SosAlert {
  id: string;
  rideId: string;
  triggeredBy: string;
  reason: string;
  status: string;
  createdAt: string;
}

/** OOP: Inheritance
 *  WHY: AdminApiService inherits BaseApiService and specializes administration governance,
 *  user blocking, matching strategy swapping, and SOS safety monitoring. */
export class AdminApiService extends BaseApiService {
  constructor() {
    super('/api');
  }

  public async getUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/admin/users');
  }

  public async blockUser(userId: string, isBlocked: boolean = true): Promise<{ id: string; isBlocked: boolean }> {
    return this.request<{ id: string; isBlocked: boolean }>(`/admin/users/${userId}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked })
    });
  }

  public async getRides(): Promise<RideData[]> {
    return this.request<RideData[]>('/admin/rides');
  }

  public async getAnalytics(): Promise<AdminAnalytics> {
    return this.request<AdminAnalytics>('/admin/analytics');
  }

  public async setMatchingStrategy(strategy: 'NEAREST' | 'HIGHEST_RATED' | 'BALANCED'): Promise<{
    currentStrategy: string;
    message: string;
  }> {
    return this.request('/admin/matching-strategy', {
      method: 'POST',
      body: JSON.stringify({ strategy })
    });
  }

  public async getSosAlerts(): Promise<SosAlert[]> {
    return this.request<SosAlert[]>('/admin/sos');
  }

  public async getTripTracking(token: string): Promise<any> {
    return this.request<any>(`/rides/track/${token}`);
  }
}

export const adminApi = new AdminApiService();

