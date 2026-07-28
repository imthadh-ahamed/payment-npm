/**
 * Business policies for the Payment Domain: small, pure, independently
 * testable functions that encode rules such as "a payment can only be
 * captured after authorization" or "a refund cannot exceed the remaining
 * refundable balance." The {@link Payment} aggregate delegates to these
 * rather than inlining the rules in its methods.
 */
import type { Currency } from './currency.js';
import type { PaymentStatus, RefundStatus } from './enums.js';
import { Money } from './money.js';
import type { Refund } from './refund.js';

/**
 * The complete set of permitted {@link PaymentStatus} transitions. A
 * transition not listed here (including any status transitioning to
 * itself) is invalid.
 *
 * `REFUNDED`, `FAILED`, `CANCELLED`, and `EXPIRED` are terminal: once
 * reached, a payment can never transition again.
 */
export const PAYMENT_STATUS_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> =
  {
    CREATED: ['AUTHORIZED', 'FAILED', 'CANCELLED', 'EXPIRED'],
    AUTHORIZED: ['CAPTURED', 'FAILED', 'CANCELLED', 'EXPIRED'],
    CAPTURED: ['PARTIALLY_REFUNDED', 'REFUNDED'],
    PARTIALLY_REFUNDED: ['REFUNDED'],
    REFUNDED: [],
    FAILED: [],
    CANCELLED: [],
    EXPIRED: [],
  };

/** Whether a {@link Payment} may transition from `from` to `to`. */
export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Whether a {@link Payment} in `status` is eligible to be captured.
 *
 * Business rule: a payment can only be captured after authorization.
 */
export function canCapturePayment(status: PaymentStatus): boolean {
  return canTransitionPaymentStatus(status, 'CAPTURED');
}

/**
 * Whether a {@link Payment} in `status` is eligible to have a refund
 * initiated against it.
 *
 * Business rule: only captured (or already partially refunded) payments can
 * be refunded — failed, cancelled, and expired payments cannot.
 */
export function canInitiateRefund(status: PaymentStatus): boolean {
  return status === 'CAPTURED' || status === 'PARTIALLY_REFUNDED';
}

/**
 * Sums the amounts of every refund in `refunds` whose status is `status`.
 * Assumes all refunds share `currency` — the {@link Payment} aggregate
 * guarantees this since every refund it creates is denominated in its own
 * captured amount's currency.
 */
function sumRefundsByStatus(
  refunds: readonly Refund[],
  status: RefundStatus,
  currency: Currency,
): Money {
  let total = Money.zero(currency);
  for (const refund of refunds) {
    if (refund.status === status) {
      total = total.add(refund.amount);
    }
  }
  return total;
}

/**
 * The total amount already refunded (status `COMPLETED`). This is the
 * amount that has actually left the merchant's account.
 */
export function calculateCompletedRefundAmount(
  refunds: readonly Refund[],
  currency: Currency,
): Money {
  return sumRefundsByStatus(refunds, 'COMPLETED', currency);
}

/**
 * The total amount reserved by refunds that are either pending or
 * completed (`INITIATED` or `COMPLETED`). Reserving pending refunds too —
 * not just completed ones — prevents two concurrently-initiated refunds
 * from together over-refunding a payment before either has settled.
 */
export function calculateReservedRefundAmount(
  refunds: readonly Refund[],
  currency: Currency,
): Money {
  const initiated = sumRefundsByStatus(refunds, 'INITIATED', currency);
  const completed = sumRefundsByStatus(refunds, 'COMPLETED', currency);
  return initiated.add(completed);
}

/**
 * The remaining amount of `capturedAmount` that is still available to
 * refund, after subtracting every pending or completed refund.
 *
 * Business rule: a refund's amount can never exceed this value — over-refund
 * prevention.
 */
export function calculateRemainingRefundableAmount(
  capturedAmount: Money,
  refunds: readonly Refund[],
): Money {
  const reserved = calculateReservedRefundAmount(refunds, capturedAmount.currency);
  return capturedAmount.subtract(reserved);
}
