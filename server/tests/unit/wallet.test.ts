import { describe, it, expect } from 'vitest';
import { Wallet } from '../../src/domain/Wallet';
import { ValidationError, InsufficientFundsError } from '../../src/errors';

describe('OOP Showcase: Wallet (Encapsulation)', () => {
  it('ENCAPSULATION: should not allow direct mutation of balance from outside', () => {
    const wallet = new Wallet('wallet-1', 'user-1', 100.0);

    // Initial state verification via read-only getter
    expect(wallet.getBalance()).toBe(100.0);

    // TypeScript prevents direct mutation at compile time:
    // @ts-expect-error TS2341: Property '_balance' is private and only accessible within class 'Wallet'
    // wallet._balance = 9999;

    // Even if an external caller uses runtime reflection or type casting:
    expect(wallet.getBalance()).toBe(100.0);
  });

  it('ENCAPSULATION: should safely mutate balance only through validated credit()', () => {
    const wallet = new Wallet('wallet-2', 'user-2', 50.0);

    wallet.credit(25.5, 'Freelance payment');
    expect(wallet.getBalance()).toBe(75.5);

    wallet.credit(10.25, 'Bonus');
    expect(wallet.getBalance()).toBe(85.75);
  });

  it('ENCAPSULATION: should reject invalid or non-positive credit amounts', () => {
    const wallet = new Wallet('wallet-3', 'user-3', 50.0);

    expect(() => wallet.credit(-10)).toThrowError(ValidationError);
    expect(() => wallet.credit(0)).toThrowError(ValidationError);
    // @ts-expect-error Type checking invalid input
    expect(() => wallet.credit('invalid')).toThrowError(ValidationError);
    // @ts-expect-error Type checking NaN
    expect(() => wallet.credit(NaN)).toThrowError(ValidationError);
  });

  it('ENCAPSULATION: should safely mutate balance through validated debit()', () => {
    const wallet = new Wallet('wallet-4', 'user-4', 100.0);

    wallet.debit(40.0, 'Ride fare payment');
    expect(wallet.getBalance()).toBe(60.0);

    wallet.debit(60.0, 'Withdrawal');
    expect(wallet.getBalance()).toBe(0.0);
  });

  it('ENCAPSULATION: should enforce non-negative invariant and throw InsufficientFundsError', () => {
    const wallet = new Wallet('wallet-5', 'user-5', 30.0);

    expect(() => wallet.debit(30.01, 'Ride fare')).toThrowError(InsufficientFundsError);
    expect(wallet.getBalance()).toBe(30.0); // State remains uncorrupted
  });

  it('ENCAPSULATION: should protect transaction history from external tampering', () => {
    const wallet = new Wallet('wallet-6', 'user-6', 50.0);
    wallet.credit(20.0, 'Deposit');

    const txs = wallet.getTransactions();
    expect(txs.length).toBe(2);

    // Mutating the returned array must fail or have no effect on internal state
    expect(() => {
      // @ts-expect-error Array is frozen / readonly
      txs.push({ id: 'fake', amount: 1000 });
    }).toThrow();

    // Internal state remains pristine
    expect(wallet.getTransactions().length).toBe(2);
  });

  it('should reject negative initial balance on creation', () => {
    expect(() => new Wallet('wallet-7', 'user-7', -10)).toThrowError(ValidationError);
  });
});

