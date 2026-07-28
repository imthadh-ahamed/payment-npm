import { describe, expect, it } from 'vitest';

import { Currency } from '../../src/domain/currency.js';
import {
  InvalidRefundAmountError,
  InvalidRefundStateTransitionError,
} from '../../src/domain/errors.js';
import { PaymentId, RefundId } from '../../src/domain/identifiers.js';
import { Money } from '../../src/domain/money.js';
import { Refund } from '../../src/domain/refund.js';
import { MockClock } from '../../src/shared/index.js';

const usd = Currency.create('USD');
const refundId = RefundId.create('refund-1');
const paymentId = PaymentId.create('payment-1');

function createRefund(amount = Money.fromMajor(10, usd)): Refund {
  return Refund.create(
    { id: refundId, paymentId, amount },
    new MockClock(new Date('2024-01-01T00:00:00.000Z')),
  );
}

describe('Refund', () => {
  describe('create', () => {
    it('starts in the INITIATED status', () => {
      expect(createRefund().status).toBe('INITIATED');
    });

    it('records the payment id, amount, reason, and creation time', () => {
      const refund = Refund.create(
        { id: refundId, paymentId, amount: Money.fromMajor(10, usd), reason: 'customer request' },
        new MockClock(new Date('2024-01-01T00:00:00.000Z')),
      );
      expect(refund.paymentId.equals(paymentId)).toBe(true);
      expect(refund.amount.amountMinorUnits).toBe(1000);
      expect(refund.reason).toBe('customer request');
      expect(refund.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    });

    it('defaults reason to undefined when not provided', () => {
      expect(createRefund().reason).toBeUndefined();
    });

    it('throws InvalidRefundAmountError for a zero amount', () => {
      expect(() => createRefund(Money.zero(usd))).toThrow(InvalidRefundAmountError);
    });

    it('throws InvalidRefundAmountError for a negative amount', () => {
      expect(() => createRefund(Money.fromMinor(-100, usd))).toThrow(InvalidRefundAmountError);
    });
  });

  describe('complete', () => {
    it('transitions from INITIATED to COMPLETED', () => {
      const refund = createRefund();
      const result = refund.complete();
      expect(result.isSuccess()).toBe(true);
      expect(refund.status).toBe('COMPLETED');
    });

    it('fails when the refund is not INITIATED', () => {
      const refund = createRefund();
      refund.complete();
      const result = refund.complete();
      expect(result.isFailure()).toBe(true);
      expect(
        result.fold(
          () => null,
          (error) => error,
        ),
      ).toBeInstanceOf(InvalidRefundStateTransitionError);
    });
  });

  describe('fail', () => {
    it('transitions from INITIATED to FAILED', () => {
      const refund = createRefund();
      const result = refund.fail();
      expect(result.isSuccess()).toBe(true);
      expect(refund.status).toBe('FAILED');
    });

    it('fails when the refund is not INITIATED', () => {
      const refund = createRefund();
      refund.fail();
      const result = refund.fail();
      expect(result.isFailure()).toBe(true);
    });

    it('cannot be completed after it has failed', () => {
      const refund = createRefund();
      refund.fail();
      expect(refund.complete().isFailure()).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes to a plain DTO', () => {
      const refund = Refund.create(
        { id: refundId, paymentId, amount: Money.fromMajor(10, usd), reason: 'duplicate charge' },
        new MockClock(new Date('2024-01-01T00:00:00.000Z')),
      );
      expect(refund.serialize()).toEqual({
        id: 'refund-1',
        paymentId: 'payment-1',
        amount: { amountMinorUnits: 1000, currency: 'USD' },
        status: 'INITIATED',
        reason: 'duplicate charge',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
    });
  });
});
