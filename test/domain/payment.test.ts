import { describe, expect, it } from 'vitest';

import { Currency } from '../../src/domain/currency.js';
import {
  CurrencyMismatchError,
  InvalidPaymentStateTransitionError,
  InvalidRefundAmountError,
  RefundExceedsRefundableAmountError,
  RefundNotFoundError,
} from '../../src/domain/errors.js';
import {
  PaymentAuthorized,
  PaymentCancelled,
  PaymentCaptured,
  PaymentCreated,
  PaymentExpired,
  PaymentFailed,
  RefundCompleted,
  RefundFailed,
  RefundInitiated,
} from '../../src/domain/events.js';
import {
  CustomerId,
  MerchantId,
  OrderId,
  PaymentId,
  RefundId,
} from '../../src/domain/identifiers.js';
import { Money } from '../../src/domain/money.js';
import { Payment, type PaymentCreateParams } from '../../src/domain/payment.js';
import { MockClock, MockUuidGenerator } from '../../src/shared/index.js';

const usd = Currency.create('USD');
const orderId = OrderId.create('order-1');
const customerId = CustomerId.create('customer-1');
const merchantId = MerchantId.create('merchant-1');

function createParams(overrides: Partial<PaymentCreateParams> = {}): PaymentCreateParams {
  return {
    id: PaymentId.create('payment-1'),
    orderId,
    customerId,
    merchantId,
    amount: Money.fromMajor(100, usd),
    method: 'CARD',
    provider: 'RAZORPAY',
    ...overrides,
  };
}

function createPayment(overrides: Partial<PaymentCreateParams> = {}): {
  payment: Payment;
  clock: MockClock;
  uuidGenerator: MockUuidGenerator;
} {
  const clock = new MockClock(new Date('2024-01-01T00:00:00.000Z'));
  const uuidGenerator = new MockUuidGenerator(['event-1']);
  const payment = Payment.create(createParams(overrides), clock, uuidGenerator);
  payment.clearEvents();
  return { payment, clock, uuidGenerator };
}

describe('Payment.create', () => {
  it('starts in the CREATED status', () => {
    const { payment } = createPayment();
    expect(payment.status).toBe('CREATED');
  });

  it('records the requested amount, method, provider, and parties', () => {
    const { payment } = createPayment();
    expect(payment.amount.amountMinorUnits).toBe(10_000);
    expect(payment.method).toBe('CARD');
    expect(payment.provider).toBe('RAZORPAY');
    expect(payment.orderId.equals(orderId)).toBe(true);
    expect(payment.customerId.equals(customerId)).toBe(true);
    expect(payment.merchantId.equals(merchantId)).toBe(true);
  });

  it('records the creation time from the injected clock', () => {
    const { payment } = createPayment();
    expect(payment.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });

  it('has no captured amount or failure reason yet', () => {
    const { payment } = createPayment();
    expect(payment.capturedAmount).toBeUndefined();
    expect(payment.failureReason).toBeUndefined();
  });

  it('starts with zero remaining refundable amount', () => {
    const { payment } = createPayment();
    expect(payment.remainingRefundableAmount.amountMinorUnits).toBe(0);
  });

  it('raises a PaymentCreated event with the expected payload', () => {
    const clock = new MockClock(new Date('2024-01-01T00:00:00.000Z'));
    const uuidGenerator = new MockUuidGenerator(['event-1']);
    const payment = Payment.create(createParams(), clock, uuidGenerator);

    const events = payment.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PaymentCreated);
    const event = events[0] as PaymentCreated;
    expect(event.eventName).toBe('PaymentCreated');
    expect(event.eventId).toBe('event-1');
    expect(event.occurredAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(event.aggregateId).toBe('payment-1');
    expect(event.payload).toEqual({
      amount: { amountMinorUnits: 10_000, currency: 'USD' },
      orderId: 'order-1',
      customerId: 'customer-1',
      merchantId: 'merchant-1',
    });
  });

  it('throws for a zero amount', () => {
    const clock = new MockClock();
    const uuidGenerator = new MockUuidGenerator();
    expect(() =>
      Payment.create(createParams({ amount: Money.zero(usd) }), clock, uuidGenerator),
    ).toThrow();
  });
});

describe('Payment lifecycle transitions', () => {
  it('authorize() transitions CREATED -> AUTHORIZED and raises PaymentAuthorized', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    const result = payment.authorize(clock, uuidGenerator);

    expect(result.isSuccess()).toBe(true);
    expect(payment.status).toBe('AUTHORIZED');
    const events = payment.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PaymentAuthorized);
  });

  it('capture() transitions AUTHORIZED -> CAPTURED, sets capturedAmount, and raises PaymentCaptured', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.authorize(clock, uuidGenerator);
    payment.clearEvents();

    const result = payment.capture(clock, uuidGenerator);

    expect(result.isSuccess()).toBe(true);
    expect(payment.status).toBe('CAPTURED');
    expect(payment.capturedAmount?.amountMinorUnits).toBe(10_000);
    expect(payment.remainingRefundableAmount.amountMinorUnits).toBe(10_000);
    const events = payment.getDomainEvents();
    expect(events[0]).toBeInstanceOf(PaymentCaptured);
    expect((events[0] as PaymentCaptured).payload.capturedAmount).toEqual({
      amountMinorUnits: 10_000,
      currency: 'USD',
    });
  });

  it('capture() cannot happen before authorize() — business rule', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    const result = payment.capture(clock, uuidGenerator);

    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(InvalidPaymentStateTransitionError);
    expect(payment.status).toBe('CREATED');
    expect(payment.getDomainEvents()).toHaveLength(0);
  });

  it('fail() transitions CREATED -> FAILED, records the reason, and raises PaymentFailed', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    const result = payment.fail('CARD_DECLINED', clock, uuidGenerator);

    expect(result.isSuccess()).toBe(true);
    expect(payment.status).toBe('FAILED');
    expect(payment.failureReason).toBe('CARD_DECLINED');
    expect(payment.getDomainEvents()[0]).toBeInstanceOf(PaymentFailed);
  });

  it('fail() is also permitted from AUTHORIZED', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.authorize(clock, uuidGenerator);
    const result = payment.fail('PROCESSOR_ERROR', clock, uuidGenerator);
    expect(result.isSuccess()).toBe(true);
    expect(payment.status).toBe('FAILED');
  });

  it('cancel() transitions CREATED -> CANCELLED and raises PaymentCancelled', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    const result = payment.cancel(clock, uuidGenerator);

    expect(result.isSuccess()).toBe(true);
    expect(payment.status).toBe('CANCELLED');
    expect(payment.getDomainEvents()[0]).toBeInstanceOf(PaymentCancelled);
  });

  it('expire() transitions CREATED -> EXPIRED and raises PaymentExpired', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    const result = payment.expire(clock, uuidGenerator);

    expect(result.isSuccess()).toBe(true);
    expect(payment.status).toBe('EXPIRED');
    expect(payment.getDomainEvents()[0]).toBeInstanceOf(PaymentExpired);
  });

  it('expired payments cannot transition further — business rule', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.expire(clock, uuidGenerator);

    expect(payment.authorize(clock, uuidGenerator).isFailure()).toBe(true);
    expect(payment.cancel(clock, uuidGenerator).isFailure()).toBe(true);
    expect(payment.fail('UNKNOWN', clock, uuidGenerator).isFailure()).toBe(true);
  });

  it('captured payments cannot fail or cancel retroactively', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.authorize(clock, uuidGenerator);
    payment.capture(clock, uuidGenerator);

    expect(payment.fail('UNKNOWN', clock, uuidGenerator).isFailure()).toBe(true);
    expect(payment.cancel(clock, uuidGenerator).isFailure()).toBe(true);
  });

  it('a captured payment cannot be authorized again', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.authorize(clock, uuidGenerator);
    payment.capture(clock, uuidGenerator);

    expect(payment.authorize(clock, uuidGenerator).isFailure()).toBe(true);
  });
});

describe('Payment.initiateRefund', () => {
  function capturedPayment(amountMajor = 100) {
    const { payment, clock, uuidGenerator } = createPayment({
      amount: Money.fromMajor(amountMajor, usd),
    });
    payment.authorize(clock, uuidGenerator);
    payment.capture(clock, uuidGenerator);
    payment.clearEvents();
    return { payment, clock, uuidGenerator };
  }

  it('creates an INITIATED refund and raises RefundInitiated', () => {
    const { payment, clock, uuidGenerator } = capturedPayment();
    const result = payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(30, usd) },
      clock,
      uuidGenerator,
    );

    expect(result.isSuccess()).toBe(true);
    const refund = result.unwrap();
    expect(refund.status).toBe('INITIATED');
    expect(refund.amount.amountMinorUnits).toBe(3000);
    expect(payment.refunds).toHaveLength(1);

    const events = payment.getDomainEvents();
    expect(events[0]).toBeInstanceOf(RefundInitiated);
    expect((events[0] as RefundInitiated).payload.refundId).toBe('refund-1');
  });

  it('records an optional reason on the created refund', () => {
    const { payment, clock, uuidGenerator } = capturedPayment();
    const result = payment.initiateRefund(
      {
        id: RefundId.create('refund-1'),
        amount: Money.fromMajor(30, usd),
        reason: 'duplicate charge',
      },
      clock,
      uuidGenerator,
    );
    expect(result.unwrap().reason).toBe('duplicate charge');
  });

  it('does not change payment status on its own', () => {
    const { payment, clock, uuidGenerator } = capturedPayment();
    payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(30, usd) },
      clock,
      uuidGenerator,
    );
    expect(payment.status).toBe('CAPTURED');
  });

  it('reduces remainingRefundableAmount by the initiated amount', () => {
    const { payment, clock, uuidGenerator } = capturedPayment();
    payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(30, usd) },
      clock,
      uuidGenerator,
    );
    expect(payment.remainingRefundableAmount.amountMinorUnits).toBe(7000);
  });

  it('rejects refunds before the payment is captured — failed payments cannot be refunded', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.fail('CARD_DECLINED', clock, uuidGenerator);

    const result = payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(10, usd) },
      clock,
      uuidGenerator,
    );
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(InvalidPaymentStateTransitionError);
  });

  it('rejects a refund in a different currency', () => {
    const { payment, clock, uuidGenerator } = capturedPayment();
    const eur = Currency.create('EUR');
    const result = payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(10, eur) },
      clock,
      uuidGenerator,
    );
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(CurrencyMismatchError);
  });

  it('rejects a zero or negative refund amount', () => {
    const { payment, clock, uuidGenerator } = capturedPayment();
    const result = payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.zero(usd) },
      clock,
      uuidGenerator,
    );
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(InvalidRefundAmountError);
  });

  it('rejects a refund that exceeds the captured amount — over-refund prevention', () => {
    const { payment, clock, uuidGenerator } = capturedPayment(100);
    const result = payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(150, usd) },
      clock,
      uuidGenerator,
    );
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(RefundExceedsRefundableAmountError);
  });

  it('rejects a second refund that would exceed the remaining balance after a first pending refund', () => {
    const { payment, clock, uuidGenerator } = capturedPayment(100);
    payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(60, usd) },
      clock,
      uuidGenerator,
    );

    const second = payment.initiateRefund(
      { id: RefundId.create('refund-2'), amount: Money.fromMajor(60, usd) },
      clock,
      uuidGenerator,
    );
    expect(second.isFailure()).toBe(true);
    expect(
      second.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(RefundExceedsRefundableAmountError);
  });

  it('supports multiple partial refunds that together do not exceed the captured amount', () => {
    const { payment, clock, uuidGenerator } = capturedPayment(100);
    const first = payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(40, usd) },
      clock,
      uuidGenerator,
    );
    const second = payment.initiateRefund(
      { id: RefundId.create('refund-2'), amount: Money.fromMajor(60, usd) },
      clock,
      uuidGenerator,
    );

    expect(first.isSuccess()).toBe(true);
    expect(second.isSuccess()).toBe(true);
    expect(payment.remainingRefundableAmount.amountMinorUnits).toBe(0);
  });
});

describe('Payment.completeRefund', () => {
  function capturedPaymentWithRefund(amountMajor = 100, refundMajor = 40) {
    const { payment, clock, uuidGenerator } = createPayment({
      amount: Money.fromMajor(amountMajor, usd),
    });
    payment.authorize(clock, uuidGenerator);
    payment.capture(clock, uuidGenerator);
    const refundId = RefundId.create('refund-1');
    payment.initiateRefund(
      { id: refundId, amount: Money.fromMajor(refundMajor, usd) },
      clock,
      uuidGenerator,
    );
    payment.clearEvents();
    return { payment, clock, uuidGenerator, refundId };
  }

  it('completes the refund and raises RefundCompleted', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund();
    const result = payment.completeRefund(refundId, clock, uuidGenerator);

    expect(result.isSuccess()).toBe(true);
    expect(payment.refunds[0]?.status).toBe('COMPLETED');
    expect(payment.getDomainEvents()[0]).toBeInstanceOf(RefundCompleted);
  });

  it('transitions the payment to PARTIALLY_REFUNDED when the refund does not cover the full captured amount', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund(100, 40);
    payment.completeRefund(refundId, clock, uuidGenerator);
    expect(payment.status).toBe('PARTIALLY_REFUNDED');
  });

  it('transitions the payment to REFUNDED when completed refunds cover the full captured amount', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund(100, 100);
    payment.completeRefund(refundId, clock, uuidGenerator);
    expect(payment.status).toBe('REFUNDED');
  });

  it('reaches REFUNDED across multiple completed partial refunds', () => {
    const { payment, clock, uuidGenerator } = createPayment({ amount: Money.fromMajor(100, usd) });
    payment.authorize(clock, uuidGenerator);
    payment.capture(clock, uuidGenerator);

    const firstId = RefundId.create('refund-1');
    const secondId = RefundId.create('refund-2');
    payment.initiateRefund({ id: firstId, amount: Money.fromMajor(40, usd) }, clock, uuidGenerator);
    payment.initiateRefund(
      { id: secondId, amount: Money.fromMajor(60, usd) },
      clock,
      uuidGenerator,
    );

    payment.completeRefund(firstId, clock, uuidGenerator);
    expect(payment.status).toBe('PARTIALLY_REFUNDED');

    payment.completeRefund(secondId, clock, uuidGenerator);
    expect(payment.status).toBe('REFUNDED');
  });

  it('fails with RefundNotFoundError for an unknown refund id', () => {
    const { payment, clock, uuidGenerator } = capturedPaymentWithRefund();
    const result = payment.completeRefund(RefundId.create('does-not-exist'), clock, uuidGenerator);
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(RefundNotFoundError);
  });

  it('fails when the refund has already been completed', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund();
    payment.completeRefund(refundId, clock, uuidGenerator);
    const result = payment.completeRefund(refundId, clock, uuidGenerator);
    expect(result.isFailure()).toBe(true);
  });
});

describe('Payment.failRefund', () => {
  function capturedPaymentWithRefund() {
    const { payment, clock, uuidGenerator } = createPayment({ amount: Money.fromMajor(100, usd) });
    payment.authorize(clock, uuidGenerator);
    payment.capture(clock, uuidGenerator);
    const refundId = RefundId.create('refund-1');
    payment.initiateRefund(
      { id: refundId, amount: Money.fromMajor(40, usd) },
      clock,
      uuidGenerator,
    );
    payment.clearEvents();
    return { payment, clock, uuidGenerator, refundId };
  }

  it('marks the refund as FAILED and raises RefundFailed', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund();
    const result = payment.failRefund(refundId, 'PROCESSOR_ERROR', clock, uuidGenerator);

    expect(result.isSuccess()).toBe(true);
    expect(payment.refunds[0]?.status).toBe('FAILED');
    expect(payment.getDomainEvents()[0]).toBeInstanceOf(RefundFailed);
  });

  it('does not change the payment status', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund();
    payment.failRefund(refundId, 'PROCESSOR_ERROR', clock, uuidGenerator);
    expect(payment.status).toBe('CAPTURED');
  });

  it('releases the reserved amount back into remainingRefundableAmount', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund();
    expect(payment.remainingRefundableAmount.amountMinorUnits).toBe(6000);
    payment.failRefund(refundId, 'PROCESSOR_ERROR', clock, uuidGenerator);
    expect(payment.remainingRefundableAmount.amountMinorUnits).toBe(10_000);
  });

  it('fails when the refund has already failed', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund();
    payment.failRefund(refundId, 'PROCESSOR_ERROR', clock, uuidGenerator);
    const result = payment.failRefund(refundId, 'PROCESSOR_ERROR', clock, uuidGenerator);
    expect(result.isFailure()).toBe(true);
  });

  it('fails when the refund has already completed', () => {
    const { payment, clock, uuidGenerator, refundId } = capturedPaymentWithRefund();
    payment.completeRefund(refundId, clock, uuidGenerator);
    const result = payment.failRefund(refundId, 'PROCESSOR_ERROR', clock, uuidGenerator);
    expect(result.isFailure()).toBe(true);
  });

  it('fails with RefundNotFoundError for an unknown refund id', () => {
    const { payment, clock, uuidGenerator } = capturedPaymentWithRefund();
    const result = payment.failRefund(
      RefundId.create('does-not-exist'),
      'UNKNOWN',
      clock,
      uuidGenerator,
    );
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(RefundNotFoundError);
  });
});

describe('Payment.serialize', () => {
  it('serializes to a plain DTO including nested refunds', () => {
    const clock = new MockClock(new Date('2024-01-01T00:00:00.000Z'));
    const uuidGenerator = new MockUuidGenerator(['event-1', 'event-2', 'event-3', 'event-4']);
    const payment = Payment.create(
      createParams({ amount: Money.fromMajor(100, usd) }),
      clock,
      uuidGenerator,
    );
    payment.authorize(clock, uuidGenerator);
    payment.capture(clock, uuidGenerator);
    payment.initiateRefund(
      { id: RefundId.create('refund-1'), amount: Money.fromMajor(20, usd) },
      clock,
      uuidGenerator,
    );

    expect(payment.serialize()).toEqual({
      id: 'payment-1',
      orderId: 'order-1',
      customerId: 'customer-1',
      merchantId: 'merchant-1',
      amount: { amountMinorUnits: 10_000, currency: 'USD' },
      capturedAmount: { amountMinorUnits: 10_000, currency: 'USD' },
      status: 'CAPTURED',
      method: 'CARD',
      provider: 'RAZORPAY',
      failureReason: undefined,
      refunds: [
        {
          id: 'refund-1',
          paymentId: 'payment-1',
          amount: { amountMinorUnits: 2000, currency: 'USD' },
          status: 'INITIATED',
          reason: undefined,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });
});

describe('Payment aggregate — domain events', () => {
  it('clearEvents() empties the recorded event list', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.authorize(clock, uuidGenerator);
    expect(payment.getDomainEvents().length).toBeGreaterThan(0);
    payment.clearEvents();
    expect(payment.getDomainEvents()).toHaveLength(0);
  });

  it('getDomainEvents() returns a defensive copy', () => {
    const { payment, clock, uuidGenerator } = createPayment();
    payment.authorize(clock, uuidGenerator);
    const events = payment.getDomainEvents() as PaymentAuthorized[];
    events.push(new PaymentAuthorized({ eventId: 'x', occurredAt: new Date(0), aggregateId: 'x' }));
    expect(payment.getDomainEvents()).toHaveLength(1);
  });
});
