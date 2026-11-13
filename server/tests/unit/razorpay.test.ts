import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { RazorpayPayment } from '../../src/domain/payment/RazorpayPayment';
import { PaymentProcessor } from '../../src/domain/payment/PaymentProcessor';
import { RazorpayService } from '../../src/services/RazorpayService';

describe('OOP Showcase: Razorpay Gateway Integration (Encapsulation, Inheritance, Abstraction, Polymorphism)', () => {
  const processor = new PaymentProcessor();
  const testKeyId = 'rzp_test_RideXGateway2026';
  const testSecret = 'RideXSecretKey2026Production';

  it('INHERITANCE & ENCAPSULATION: RazorpayPayment extends PaymentMethod and protects state', () => {
    const rzp = new RazorpayPayment();
    expect(rzp.getMethodName()).toBe('RAZORPAY');

    // ENCAPSULATION: Order must be bound before verification
    expect(() => rzp.verifySignature('dummy_sig', testSecret)).toThrow(
      'Cannot verify signature without orderId and paymentId'
    );

    // Bind valid order and payment IDs
    rzp.bindOrder('order_123456', 'pay_abcdef');
    expect(rzp.getOrderId()).toBe('order_123456');
    expect(rzp.getPaymentId()).toBe('pay_abcdef');
  });

  it('ENCAPSULATION & SECURITY: Cryptographic HMAC-SHA256 signature verification', () => {
    const rzp = new RazorpayPayment();
    const orderId = 'order_test_987';
    const paymentId = 'pay_test_456';
    rzp.bindOrder(orderId, paymentId);

    // Compute legitimate HMAC SHA256 signature
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Valid signature matches
    const isValid = rzp.verifySignature(validSignature, testSecret);
    expect(isValid).toBe(true);

    // Tampered signature fails
    const tamperedSignature = validSignature.replace('a', 'b');
    const isTamperedValid = rzp.verifySignature(tamperedSignature, testSecret);
    expect(isTamperedValid).toBe(false);
  });

  it('POLYMORPHISM: PaymentProcessor seamlessly processes RazorpayPayment via IPaymentMethod contract', async () => {
    const rzp = new RazorpayPayment();
    const orderId = 'order_proc_111';
    const paymentId = 'pay_proc_222';
    rzp.bindOrder(orderId, paymentId);

    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    rzp.verifySignature(validSignature, testSecret);

    // POLYMORPHISM: Passes into processor without type discrimination
    const result = await processor.process(rzp, 350.0);

    expect(result.success).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.amount).toBe(350.0);
    expect(result.transactionId).toBe(paymentId);

    // Specialized receipt formatting
    const receipt = rzp.receipt();
    expect(receipt.method).toBe('RAZORPAY');
    expect(receipt.amount).toBe(350.0);
    expect((receipt as any).orderId).toBe(orderId);
    expect((receipt as any).paymentId).toBe(paymentId);
  });

  it('SERVICE ABSTRACTION: RazorpayService handles order creation and signature validation', async () => {
    const service = new RazorpayService(testKeyId, testSecret);
    expect(service.getKeyId()).toBe(testKeyId);

    // Order Creation (standard 100 multiplier for paise)
    const order = await service.createOrder(250.0, 'INR', 'receipt_test_1');
    expect(order.id).toBeDefined();
    expect(order.amount).toBe(250.0);
    expect(order.amountInPaise).toBe(25000); // 250 * 100 paise
    expect(order.currency).toBe('INR');

    // Payment verification through service
    const fakePaymentId = 'pay_svc_test_333';
    const validSig = crypto
      .createHmac('sha256', testSecret)
      .update(`${order.id}|${fakePaymentId}`)
      .digest('hex');

    const verifySuccess = service.verifyPayment({
      orderId: order.id,
      paymentId: fakePaymentId,
      signature: validSig
    });
    expect(verifySuccess).toBe(true);

    const verifyFailed = service.verifyPayment({
      orderId: order.id,
      paymentId: fakePaymentId,
      signature: 'invalid_fraudulent_sig'
    });
    expect(verifyFailed).toBe(false);
  });
});
