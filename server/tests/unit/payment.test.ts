import { describe, it, expect } from 'vitest';
import { PaymentProcessor } from '../../src/domain/payment/PaymentProcessor';
import { CashPayment } from '../../src/domain/payment/CashPayment';
import { WalletPayment } from '../../src/domain/payment/WalletPayment';
import { UPIPayment } from '../../src/domain/payment/UPIPayment';
import { CardPayment } from '../../src/domain/payment/CardPayment';
import { PaymentMethod } from '../../src/domain/payment/PaymentMethod';
import { Customer } from '../../src/domain/Customer';
import { Wallet } from '../../src/domain/Wallet';

describe('OOP Showcase: Payments (Abstraction & Polymorphism)', () => {
  const processor = new PaymentProcessor();

  const createCustomer = (initialBalance: number = 200.0) => {
    const wallet = new Wallet('w-test-1', 'u-test-1', initialBalance);
    return new Customer(
      'c-test-1',
      'Rahul Sharma',
      'rahul@example.in',
      'hash_pwd_123',
      '+919876543210',
      wallet
    );
  };

  it('ABSTRACTION: PaymentMethod is abstract and cannot be directly instantiated', () => {
    // ABSTRACTION: Direct instantiation prevented by TypeScript and runtime guard
    // @ts-expect-error TS2511: Cannot create an instance of an abstract class.
    expect(() => new PaymentMethod()).toThrow();
  });

  it('POLYMORPHISM: PaymentProcessor.process() works with ANY method without type checks', async () => {
    const customer = createCustomer(500.0);
    const amount = 150.0;

    // Heterogeneous collection of payment channels sharing IPaymentMethod contract
    const paymentMethods = [
      new CashPayment(),
      new WalletPayment(customer),
      new UPIPayment('rahul@okaxis', { simulatedSuccessRate: 1.0, fakeDelayMs: 0 }),
      new CardPayment('4111 2222 3333 4444', 'Rahul Sharma', {
        simulatedSuccessRate: 1.0,
        fakeDelayMs: 0
      })
    ];

    // POLYMORPHISM: Exact same processor.process() call executes each channel polymorphically
    for (const method of paymentMethods) {
      const result = await processor.process(method, amount);
      expect(result.amount).toBe(amount);
      expect(result.transactionId).toBeDefined();

      // INHERITANCE: Every concrete subclass inherits the receipt() template method
      const receipt = method.receipt();
      expect(receipt.amount).toBe(amount);
      expect(receipt.method).toBe(method.getMethodName());
    }
  });

  it('POLYMORPHISM: CashPayment marks status as PENDING until confirmed by driver', async () => {
    const cashMethod = new CashPayment();
    const result = await processor.process(cashMethod, 120.0);

    // Cash transactions start in PENDING status
    expect(result.status).toBe('PENDING');
    expect(result.success).toBe(true);
    expect(cashMethod.isConfirmedByDriver()).toBe(false);

    // Driver receives physical currency and confirms settlement
    cashMethod.confirmByDriver();
    expect(cashMethod.isConfirmedByDriver()).toBe(true);
    expect(cashMethod.receipt().status).toBe('COMPLETED');
  });

  it('POLYMORPHISM: WalletPayment debits Customer Wallet and enforces balance checks', async () => {
    const customer = createCustomer(200.0);
    const walletMethod = new WalletPayment(customer);

    // Initial balance: 200.0
    const result1 = await processor.process(walletMethod, 80.0);
    expect(result1.status).toBe('COMPLETED');
    expect(customer.getWallet().getBalance()).toBe(120.0); // 200 - 80

    // Attempting debit greater than remaining balance (150 > 120)
    const result2 = await processor.process(walletMethod, 150.0);
    expect(result2.status).toBe('FAILED');
    expect(result2.message).toContain('Insufficient funds');
    expect(customer.getWallet().getBalance()).toBe(120.0); // State preserved
  });

  it('POLYMORPHISM: UPIPayment simulates gateway latency and handles success / failure modes', async () => {
    // Deterministic 100% success test
    const successfulUpi = new UPIPayment('user@okhdfcbank', {
      simulatedSuccessRate: 1.0,
      fakeDelayMs: 5
    });
    const successResult = await processor.process(successfulUpi, 99.0);
    expect(successResult.status).toBe('COMPLETED');
    expect(successResult.success).toBe(true);

    // Deterministic failure test (e.g. gateway timeout)
    const failedUpi = new UPIPayment('user@okhdfcbank', {
      simulatedSuccessRate: 0.0,
      fakeDelayMs: 0
    });
    const failResult = await processor.process(failedUpi, 99.0);
    expect(failResult.status).toBe('FAILED');
    expect(failResult.success).toBe(false);
  });

  it('POLYMORPHISM & ENCAPSULATION: CardPayment masks card PAN and simulates gateway auth', async () => {
    const cardMethod = new CardPayment('4111 2222 3333 5678', 'Priya Patel', {
      simulatedSuccessRate: 1.0,
      fakeDelayMs: 5
    });

    // ENCAPSULATION: Full PAN is never exposed
    expect(cardMethod.getMaskedCardNumber()).toBe('****-****-****-5678');

    const result = await processor.process(cardMethod, 250.0);
    expect(result.status).toBe('COMPLETED');
    expect(result.message).toContain('****-****-****-5678');
  });
});

