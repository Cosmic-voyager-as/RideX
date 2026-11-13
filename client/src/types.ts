export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export type VehicleCategory = 'BIKE' | 'AUTO' | 'MINI' | 'SEDAN' | 'SUV' | 'PREMIUM';

export type RideStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  permissions: string[];
  createdAt: string;
  wallet?: {
    id: string;
    userId: string;
    balance: number;
    transactionCount: number;
  };
  licenseNumber?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'ON_TRIP';
  earnings?: number;
  ratingAverage?: number;
  ratingCount?: number;
  vehicle?: {
    plateNumber: string;
    model: string;
    color: string;
    seatingCapacity: number;
    type: VehicleCategory;
  };
  department?: string;
}

export interface FareBreakdown {
  base: number;
  distanceCharge: number;
  timeCharge: number;
  surgeMultiplier: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export interface RideData {
  id: string;
  rideType: string;
  customerId: string;
  customerName?: string;
  driverId: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicle?: any;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  pickup?: Location;
  dropoff?: Location;
  vehicleCategory?: VehicleCategory;
  otp?: string;
  trackingToken?: string;
  status: RideStatus;
  distanceKm: number;
  durationMin: number;
  fare: FareBreakdown | null;
  paymentMethod?: string;
  cancellationFee: number;
  createdAt: string;
  completedAt: string | null;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  createdAt: string;
}

export interface SavedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface OOPEvent {
  id: string;
  timestamp: string;
  principle: 'Encapsulation' | 'Inheritance' | 'Abstraction' | 'Polymorphism';
  title: string;
  description: string;
  codeSnippet?: string;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'DRIVER';
  message: string;
  timestamp: string;
}

export interface CallState {
  rideId: string;
  callerId: string;
  callerName: string;
  callerRole: 'CUSTOMER' | 'DRIVER';
  status: 'RINGING' | 'CONNECTED' | 'ENDED';
  timestamp: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

