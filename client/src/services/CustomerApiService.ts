import { BaseApiService } from './BaseApiService';
import { FareBreakdown, Location, RideData, SavedPlace, WalletTransaction } from '../types';

/** OOP: Inheritance
 *  WHY: CustomerApiService inherits BaseApiService network infrastructure and specializes
 *  all customer-specific domain operations (fare estimates, booking, cancellation, wallet, ratings). */
export class CustomerApiService extends BaseApiService {
  constructor() {
    super('/api');
  }

  public async estimateFare(
    vehicleCategory: string,
    distanceKm: number,
    durationMin: number,
    promoCode?: string
  ): Promise<FareBreakdown> {
    return this.request<FareBreakdown>('/rides/estimate', {
      method: 'POST',
      body: JSON.stringify({ vehicleCategory, distanceKm, durationMin, promoCode })
    });
  }

  public async bookRide(params: {
    pickup: Location;
    dropoff: Location;
    vehicleCategory: string;
    rideType: string;
    paymentMethod: string;
    distanceKm?: number;
    durationMin?: number;
    promoCode?: string;
  }): Promise<RideData> {
    return this.request<RideData>('/rides', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  public async getMyRides(): Promise<RideData[]> {
    return this.request<RideData[]>('/rides/mine');
  }

  public async getRideById(rideId: string): Promise<RideData> {
    return this.request<RideData>(`/rides/${rideId}`);
  }

  public async cancelRide(rideId: string, reason?: string): Promise<{ cancellationFee: number; ride: RideData }> {
    return this.request<{ cancellationFee: number; ride: RideData }>(`/rides/${rideId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public async rateDriver(rideId: string, score: number, comment?: string): Promise<any> {
    return this.request<any>(`/rides/${rideId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ score, comment })
    });
  }

  public async getWallet(): Promise<{
    id: string;
    userId: string;
    balance: number;
    transactions: WalletTransaction[];
  }> {
    return this.request('/customer/wallet');
  }

  public async topUpWallet(
    amount: number,
    description?: string
  ): Promise<{ balance: number; message: string }> {
    return this.request('/customer/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, description })
    });
  }

  public async getSavedPlaces(): Promise<SavedPlace[]> {
    return this.request('/customer/saved-places');
  }

  public async addSavedPlace(place: { name: string; latitude: number; longitude: number; address: string }): Promise<SavedPlace> {
    return this.request('/customer/saved-places', {
      method: 'POST',
      body: JSON.stringify(place)
    });
  }

  public async applyPromo(code: string, fareAmount: number): Promise<{ valid: boolean; discount: number; finalFare: number }> {
    return this.request('/customer/promo/apply', {
      method: 'POST',
      body: JSON.stringify({ code, fareAmount })
    });
  }

  // RAZORPAY PAYMENT GATEWAY INTEGRATION
  public async getRazorpayConfig(): Promise<{ keyId: string; currency: string }> {
    return this.request('/payment/razorpay/config');
  }

  public async createRazorpayOrder(
    amount: number,
    purpose: 'WALLET_TOPUP' | 'RIDE_PAYMENT' = 'WALLET_TOPUP',
    rideId?: string
  ): Promise<{
    orderId: string;
    amount: number;
    amountInPaise: number;
    currency: string;
    receipt: string;
    status: string;
    keyId: string;
  }> {
    return this.request('/payment/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, purpose, rideId })
    });
  }

  public async verifyRazorpayPayment(payload: {
    orderId: string;
    paymentId: string;
    signature: string;
    amount: number;
    purpose: 'WALLET_TOPUP' | 'RIDE_PAYMENT';
    rideId?: string;
  }): Promise<{
    verified: boolean;
    receipt: any;
    paymentId: string;
    orderId: string;
    newBalance?: number;
    message: string;
  }> {
    return this.request('/payment/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

export const customerApi = new CustomerApiService();

