import { ValidationError, InsufficientFundsError } from '../errors';

export interface WalletTransaction {
  readonly id: string;
  readonly walletId: string;
  readonly amount: number;
  readonly type: 'CREDIT' | 'DEBIT';
  readonly description: string;
  readonly createdAt: Date;
}

/** OOP: Encapsulation
 *  WHY: Encapsulates financial state by keeping balance and transactions strictly private, permitting state changes only through validated credit and debit operations. */
export class Wallet {
  // ENCAPSULATION: All internal fields are strictly private
  private readonly _id: string;
  private readonly _userId: string;
  // ENCAPSULATION: balance is private and cannot be directly mutated from outside
  private _balance: number;
  // ENCAPSULATION: transaction ledger is private to ensure financial integrity
  private readonly _transactions: WalletTransaction[];

  constructor(
    id: string,
    userId: string,
    initialBalance: number = 0.0,
    existingTransactions?: WalletTransaction[]
  ) {
    if (initialBalance < 0) {
      throw new ValidationError('Initial wallet balance cannot be negative');
    }
    this._id = id;
    this._userId = userId;
    // ENCAPSULATION: balance is initialized with precision rounding
    this._balance = Math.round(initialBalance * 100) / 100;
    this._transactions = existingTransactions ? [...existingTransactions] : [];

    if (!existingTransactions && initialBalance > 0) {
      this._transactions.push({
        id: `tx-init-${Date.now()}`,
        walletId: id,
        amount: initialBalance,
        type: 'CREDIT',
        description: 'Initial deposit',
        createdAt: new Date()
      });
    }
  }

  // ENCAPSULATION: Read-only getter for ID
  public getId(): string {
    return this._id;
  }

  // ENCAPSULATION: Read-only getter for User ID
  public getUserId(): string {
    return this._userId;
  }

  // ENCAPSULATION: Read-only getter for Balance
  public getBalance(): number {
    return this._balance;
  }

  // ENCAPSULATION: Defensive copy of transactions prevents external modification
  public getTransactions(): readonly WalletTransaction[] {
    return Object.freeze([...this._transactions]);
  }

  /**
   * Credits funds to the wallet.
   * Mutates balance only after strict positive number validation.
   */
  public credit(amount: number, description: string = 'Wallet Credit'): void {
    // ENCAPSULATION: Input validation protects internal state from corruption
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new ValidationError(`Credit amount must be a positive number. Received: ${amount}`);
    }

    const rounded = Math.round(amount * 100) / 100;
    this._balance = Math.round((this._balance + rounded) * 100) / 100;

    this._transactions.push({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      walletId: this._id,
      amount: rounded,
      type: 'CREDIT',
      description,
      createdAt: new Date()
    });
  }

  /**
   * Debits funds from the wallet.
   * Enforces non-negative balance invariant.
   */
  public debit(amount: number, description: string = 'Wallet Debit'): void {
    // ENCAPSULATION: Input validation protects internal state
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new ValidationError(`Debit amount must be a positive number. Received: ${amount}`);
    }

    const rounded = Math.round(amount * 100) / 100;
    if (rounded > this._balance) {
      // ENCAPSULATION: Invariant enforcement — wallet balance cannot fall below zero
      throw new InsufficientFundsError(
        `Insufficient funds. Current balance: $${this._balance.toFixed(2)}, attempted debit: $${rounded.toFixed(2)}`
      );
    }

    this._balance = Math.round((this._balance - rounded) * 100) / 100;

    this._transactions.push({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      walletId: this._id,
      amount: rounded,
      type: 'DEBIT',
      description,
      createdAt: new Date()
    });
  }

  public toPublicJSON(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      balance: this._balance,
      transactionCount: this._transactions.length
    };
  }
}

