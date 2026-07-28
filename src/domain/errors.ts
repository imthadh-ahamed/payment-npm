/**
 * Domain-specific errors for the Payment Domain, built on the Shared
 * Kernel's error hierarchy. These are the failure values carried inside a
 * {@link Result} for expected business-rule violations (invalid state
 * transitions, over-refund attempts, currency mismatches) — they are
 * returned, not thrown, by the domain's public API.
 */
import { ConflictError, NotFoundError, ValidationError } from '../shared/index.js';

import type { PaymentStatus, RefundStatus } from './enums.js';

/**
 * A {@link Payment} state transition was attempted that is not permitted
 * from its current status (e.g. capturing a payment that was never
 * authorized, or refunding a payment that has already failed).
 */
export class InvalidPaymentStateTransitionError extends ConflictError {
  constructor(from: PaymentStatus, to: PaymentStatus) {
    super(`Cannot transition payment from "${from}" to "${to}".`, { metadata: { from, to } });
  }
}

/**
 * A {@link Refund} state transition was attempted that is not permitted
 * from its current status (e.g. completing a refund that already failed).
 */
export class InvalidRefundStateTransitionError extends ConflictError {
  constructor(from: RefundStatus, to: RefundStatus) {
    super(`Cannot transition refund from "${from}" to "${to}".`, { metadata: { from, to } });
  }
}

/**
 * An operation combined two {@link Money} values (or a {@link Money} value
 * and an expected currency) that do not share the same {@link Currency}.
 */
export class CurrencyMismatchError extends ValidationError {
  constructor(expected: string, actual: string) {
    super(`Currency mismatch: expected "${expected}" but received "${actual}".`, {
      metadata: { expected, actual },
    });
  }
}

/** A {@link Payment} was created with an amount that is not strictly positive. */
export class InvalidPaymentAmountError extends ValidationError {
  constructor(amountMinorUnits: number, currencyCode: string) {
    super('Payment amount must be a positive value.', {
      metadata: { amountMinorUnits, currencyCode },
    });
  }
}

/** A {@link Refund} was requested with an amount that is not strictly positive. */
export class InvalidRefundAmountError extends ValidationError {
  constructor(amountMinorUnits: number, currencyCode: string) {
    super('Refund amount must be a positive value.', {
      metadata: { amountMinorUnits, currencyCode },
    });
  }
}

/**
 * A refund was requested for more than the {@link Payment}'s remaining
 * refundable balance (captured amount minus already-initiated and
 * already-completed refunds).
 */
export class RefundExceedsRefundableAmountError extends ConflictError {
  constructor(requestedMinorUnits: number, remainingMinorUnits: number, currencyCode: string) {
    super('Refund amount exceeds the remaining refundable balance.', {
      metadata: { requestedMinorUnits, remainingMinorUnits, currencyCode },
    });
  }
}

/** A {@link Refund} was referenced by an id that does not belong to the {@link Payment}. */
export class RefundNotFoundError extends NotFoundError {
  constructor(refundId: string) {
    super(`Refund "${refundId}" was not found on this payment.`, { metadata: { refundId } });
  }
}

/**
 * The union of every domain error that can be carried inside a
 * `Result` failure returned by the Payment Domain's public API.
 */
export type PaymentDomainError =
  | CurrencyMismatchError
  | InvalidPaymentStateTransitionError
  | InvalidRefundAmountError
  | InvalidRefundStateTransitionError
  | RefundExceedsRefundableAmountError
  | RefundNotFoundError;
