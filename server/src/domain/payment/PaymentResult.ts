export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface PaymentResult {
  readonly success: boolean;
  readonly transactionId: string;
  readonly amount: number;
  readonly status: PaymentStatus;
  readonly message: string;
  readonly timestamp: Date;
}

export interface PaymentReceipt {
  readonly receiptId: string;
  readonly transactionId: string;
  readonly method: string;
  readonly amount: number;
  readonly status: PaymentStatus;
  readonly timestamp: Date;
  readonly details: string;
}

