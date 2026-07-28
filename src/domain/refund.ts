/**
 * The {@link Refund} entity.
 */
import { Entity, Guard, Result, type Clock } from '../shared/index.js';

import type { RefundStatus } from './enums.js';
import { InvalidRefundAmountError, InvalidRefundStateTransitionError } from './errors.js';
import type { PaymentId, RefundId } from './identifiers.js';
import type { Money, MoneyDTO } from './money.js';

/** The plain-object shape produced by {@link Refund.serialize}. */
export interface RefundDTO {
  readonly id: string;
  readonly paymentId: string;
  readonly amount: MoneyDTO;
  readonly status: RefundStatus;
  readonly reason: string | undefined;
  readonly createdAt: string;
}

/** Parameters accepted by {@link Refund.create}. */
export interface RefundCreateParams {
  readonly id: RefundId;
  readonly paymentId: PaymentId;
  readonly amount: Money;
  readonly reason?: string;
}

/**
 * A refund issued against a captured {@link Payment}. A `Refund` is a
 * child entity of the `Payment` aggregate: it is only ever created and
 * transitioned through `Payment`'s methods (`initiateRefund`,
 * `completeRefund`, `failRefund`), never constructed or mutated directly
 * by application code.
 *
 * Starts in the `INITIATED` status and terminates at either `COMPLETED` or
 * `FAILED` — both are final; no further transitions are permitted.
 */
export class Refund extends Entity<RefundId> {
  private _status: RefundStatus;
  private readonly _paymentId: PaymentId;
  private readonly _amount: Money;
  private readonly _reason: string | undefined;
  private readonly _createdAt: Date;

  private constructor(params: RefundCreateParams, createdAt: Date) {
    super(params.id);
    this._status = 'INITIATED';
    this._paymentId = params.paymentId;
    this._amount = params.amount;
    this._reason = params.reason;
    this._createdAt = createdAt;
  }

  /**
   * Creates a new {@link Refund} in the `INITIATED` status.
   *
   * @throws {@link InvalidRefundAmountError} if `params.amount` is not strictly positive.
   */
  static create(params: RefundCreateParams, clock: Clock): Refund {
    Guard.notNull(params.amount, 'amount');
    if (!params.amount.isPositive()) {
      throw new InvalidRefundAmountError(
        params.amount.amountMinorUnits,
        params.amount.currency.code,
      );
    }
    return new Refund(params, clock.now());
  }

  /** The current status of this refund. */
  get status(): RefundStatus {
    return this._status;
  }

  /** The identifier of the {@link Payment} this refund was issued against. */
  get paymentId(): PaymentId {
    return this._paymentId;
  }

  /** The refunded amount. */
  get amount(): Money {
    return this._amount;
  }

  /** An optional, free-text explanation supplied when the refund was initiated. */
  get reason(): string | undefined {
    return this._reason;
  }

  /** When this refund was initiated. */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Transitions this refund to `COMPLETED`.
   *
   * @returns A `Result` failure if the refund is not currently `INITIATED`.
   */
  complete(): Result<Refund, InvalidRefundStateTransitionError> {
    if (this._status !== 'INITIATED') {
      return Result.fail(new InvalidRefundStateTransitionError(this._status, 'COMPLETED'));
    }
    this._status = 'COMPLETED';
    return Result.ok(this);
  }

  /**
   * Transitions this refund to `FAILED`.
   *
   * @returns A `Result` failure if the refund is not currently `INITIATED`.
   */
  fail(): Result<Refund, InvalidRefundStateTransitionError> {
    if (this._status !== 'INITIATED') {
      return Result.fail(new InvalidRefundStateTransitionError(this._status, 'FAILED'));
    }
    this._status = 'FAILED';
    return Result.ok(this);
  }

  /** Serializes to a plain, JSON-safe DTO suitable for persistence or API responses. */
  serialize(): RefundDTO {
    return {
      id: this.id.value,
      paymentId: this._paymentId.value,
      amount: this._amount.serialize(),
      status: this._status,
      reason: this._reason,
      createdAt: this._createdAt.toISOString(),
    };
  }
}
