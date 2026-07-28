import { describe, expect, it } from 'vitest';

import { Currency } from '../../src/domain/currency.js';
import { PAYMENT_STATUSES, type PaymentStatus } from '../../src/domain/enums.js';
import { PaymentId, RefundId } from '../../src/domain/identifiers.js';
import { Money } from '../../src/domain/money.js';
import {
  PAYMENT_STATUS_TRANSITIONS,
  calculateCompletedRefundAmount,
  calculateRemainingRefundableAmount,
  calculateReservedRefundAmount,
  canCapturePayment,
  canInitiateRefund,
  canTransitionPaymentStatus,
} from '../../src/domain/policies.js';
import { Refund } from '../../src/domain/refund.js';
import { MockClock } from '../../src/shared/index.js';

const usd = Currency.create('USD');
const paymentId = PaymentId.create('payment-1');
const clock = new MockClock();

let refundSequence = 0;

function refundOf(amount: number): Refund {
  refundSequence += 1;
  const id = RefundId.create(`refund-${refundSequence.toString()}`);
  return Refund.create({ id, paymentId, amount: Money.fromMinor(amount, usd) }, clock);
}

describe('canTransitionPaymentStatus', () => {
  it.each(
    PAYMENT_STATUSES.flatMap((from) =>
      PAYMENT_STATUS_TRANSITIONS[from].map((to) => ({ from, to })),
    ),
  )('permits $from -> $to', ({ from, to }) => {
    expect(canTransitionPaymentStatus(from, to)).toBe(true);
  });

  it('rejects a terminal status transitioning anywhere', () => {
    const terminal: PaymentStatus[] = ['REFUNDED', 'FAILED', 'CANCELLED', 'EXPIRED'];
    for (const status of terminal) {
      for (const target of PAYMENT_STATUSES) {
        expect(canTransitionPaymentStatus(status, target)).toBe(false);
      }
    }
  });

  it('rejects a status transitioning to itself', () => {
    for (const status of PAYMENT_STATUSES) {
      expect(canTransitionPaymentStatus(status, status)).toBe(false);
    }
  });
});

describe('canCapturePayment', () => {
  it('is true only for AUTHORIZED', () => {
    expect(canCapturePayment('AUTHORIZED')).toBe(true);
    for (const status of PAYMENT_STATUSES) {
      if (status !== 'AUTHORIZED') {
        expect(canCapturePayment(status)).toBe(false);
      }
    }
  });
});

describe('canInitiateRefund', () => {
  it('is true for CAPTURED and PARTIALLY_REFUNDED', () => {
    expect(canInitiateRefund('CAPTURED')).toBe(true);
    expect(canInitiateRefund('PARTIALLY_REFUNDED')).toBe(true);
  });

  it('is false for every other status', () => {
    for (const status of PAYMENT_STATUSES) {
      if (status !== 'CAPTURED' && status !== 'PARTIALLY_REFUNDED') {
        expect(canInitiateRefund(status)).toBe(false);
      }
    }
  });
});

describe('calculateCompletedRefundAmount', () => {
  it('sums only COMPLETED refunds', () => {
    const completed = refundOf(300);
    completed.complete();
    const initiated = refundOf(200);
    const failed = refundOf(100);
    failed.fail();

    const total = calculateCompletedRefundAmount([completed, initiated, failed], usd);
    expect(total.amountMinorUnits).toBe(300);
  });

  it('returns zero when there are no refunds', () => {
    expect(calculateCompletedRefundAmount([], usd).amountMinorUnits).toBe(0);
  });
});

describe('calculateReservedRefundAmount', () => {
  it('sums both INITIATED and COMPLETED refunds', () => {
    const completed = refundOf(300);
    completed.complete();
    const initiated = refundOf(200);
    const failed = refundOf(100);
    failed.fail();

    const total = calculateReservedRefundAmount([completed, initiated, failed], usd);
    expect(total.amountMinorUnits).toBe(500);
  });
});

describe('calculateRemainingRefundableAmount', () => {
  it('subtracts reserved refunds from the captured amount', () => {
    const captured = Money.fromMinor(1000, usd);
    const completed = refundOf(300);
    completed.complete();
    const initiated = refundOf(200);

    const remaining = calculateRemainingRefundableAmount(captured, [completed, initiated]);
    expect(remaining.amountMinorUnits).toBe(500);
  });

  it('does not subtract failed refunds', () => {
    const captured = Money.fromMinor(1000, usd);
    const failed = refundOf(300);
    failed.fail();

    const remaining = calculateRemainingRefundableAmount(captured, [failed]);
    expect(remaining.amountMinorUnits).toBe(1000);
  });

  it('equals the full captured amount when there are no refunds', () => {
    const captured = Money.fromMinor(1000, usd);
    expect(calculateRemainingRefundableAmount(captured, []).amountMinorUnits).toBe(1000);
  });
});
