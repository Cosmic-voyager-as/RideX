import { BaseApiService } from './BaseApiService';
import { UserProfile } from '../types';

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

/** OOP: Inheritance
 *  WHY: AuthApiService inherits BaseApiService to manage authentication flows,
 *  token exchange, and current user profile hydration. */
export class AuthApiService extends BaseApiService {
  constructor() {
    super('/api');
  }

  public async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  public async loginWithGoogle(credential: string): Promise<AuthResponse> {
  return this.request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  });
}

  public async register(payload: {
    role: 'CUSTOMER' | 'DRIVER';
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicleCategory?: string;
    plateNumber?: string;
    model?: string;
    color?: string;
    licenseNumber?: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }
}

export const authApi = new AuthApiService();

