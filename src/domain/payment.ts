/**
 * The {@link Payment} aggregate root.
 */
import { AggregateRoot, Guard, Result, type Clock, type UuidGenerator } from '../shared/index.js';

import type { FailureReason, PaymentMethod, PaymentProvider, PaymentStatus } from './enums.js';
import {
  CurrencyMismatchError,
  InvalidPaymentAmountError,
  InvalidPaymentStateTransitionError,
  InvalidRefundAmountError,
  RefundExceedsRefundableAmountError,
  RefundNotFoundError,
  type PaymentDomainError,
} from './errors.js';
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
} from './events.js';
import type { CustomerId, MerchantId, OrderId, PaymentId, RefundId } from './identifiers.js';
import { Money, type MoneyDTO } from './money.js';
import {
  canInitiateRefund,
  canTransitionPaymentStatus,
  calculateCompletedRefundAmount,
  calculateRemainingRefundableAmount,
} from './policies.js';
import { Refund, type RefundDTO } from './refund.js';

/** The plain-object shape produced by {@link Payment.serialize}. */
export interface PaymentDTO {
  readonly id: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly merchantId: string;
  readonly amount: MoneyDTO;
  readonly capturedAmount: MoneyDTO | undefined;
  readonly status: PaymentStatus;
  readonly method: PaymentMethod;
  readonly provider: PaymentProvider;
  readonly failureReason: FailureReason | undefined;
  readonly refunds: readonly RefundDTO[];
  readonly createdAt: string;
}

/** Parameters accepted by {@link Payment.create}. */
export interface PaymentCreateParams {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly customerId: CustomerId;
  readonly merchantId: MerchantId;
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly provider: PaymentProvider;
}

/** Parameters accepted by {@link Payment.initiateRefund}. */
export interface InitiateRefundParams {
  readonly id: RefundId;
  readonly amount: Money;
  readonly reason?: string;
}

/**
 * The central Aggregate Root of the Payment Domain. `Payment` owns and
 * protects its own lifecycle: every state transition is validated against
 * {@link PAYMENT_STATUS_TRANSITIONS | the transition policy} before it is
 * applied, every accepted transition raises the corresponding domain event,
 * and its child {@link Refund} entities can only be created or transitioned
 * through `Payment`'s own methods — never constructed independently.
 *
 * Expected business-rule violations (an illegal transition, an over-refund
 * attempt, a currency mismatch) are returned as a `Result` failure, never
 * thrown — callers are expected to handle them as normal control flow.
 *
 * @example
 * ```ts
 * const payment = Payment.create(
 *   { id, orderId, customerId, merchantId, amount, method: 'CARD', provider: 'RAZORPAY' },
 *   clock,
 *   uuidGenerator,
 * );
 *
 * const authorized = payment.authorize(clock, uuidGenerator);
 * if (authorized.isFailure()) {
 *   // handle InvalidPaymentStateTransitionError
 * }
 *
 * payment.capture(clock, uuidGenerator);
 * const refund = payment.initiateRefund({ id: refundId, amount: partialAmount }, clock, uuidGenerator);
 * ```
 */
export class Payment extends AggregateRoot<PaymentId> {
  private _status: PaymentStatus;
  private readonly _orderId: OrderId;
  private readonly _customerId: CustomerId;
  private readonly _merchantId: MerchantId;
  private readonly _amount: Money;
  private readonly _method: PaymentMethod;
  private readonly _provider: PaymentProvider;
  private readonly _createdAt: Date;
  private _capturedAmount: Money | undefined;
  private _failureReason: FailureReason | undefined;
  private readonly _refunds: Refund[] = [];

  private constructor(params: PaymentCreateParams, createdAt: Date) {
    super(params.id);
    this._status = 'CREATED';
    this._orderId = params.orderId;
    this._customerId = params.customerId;
    this._merchantId = params.merchantId;
    this._amount = params.amount;
    this._method = params.method;
    this._provider = params.provider;
    this._createdAt = createdAt;
  }

  /**
   * Creates a new {@link Payment} in the `CREATED` status and raises
   * {@link PaymentCreated}.
   *
   * @throws {@link InvalidPaymentAmountError} if `params.amount` is not strictly positive.
   */
  static create(params: PaymentCreateParams, clock: Clock, uuidGenerator: UuidGenerator): Payment {
    Guard.notNull(params.amount, 'amount');
    if (!params.amount.isPositive()) {
      throw new InvalidPaymentAmountError(
        params.amount.amountMinorUnits,
        params.amount.currency.code,
      );
    }

    const payment = new Payment(params, clock.now());
    payment.raiseEvent(
      new PaymentCreated(payment.buildEventProps(clock, uuidGenerator), {
        amount: payment._amount.serialize(),
        orderId: payment._orderId.value,
        customerId: payment._customerId.value,
        merchantId: payment._merchantId.value,
      }),
    );
    return payment;
  }

  /** The current lifecycle status. */
  get status(): PaymentStatus {
    return this._status;
  }

  /** The order this payment was collected for. */
  get orderId(): OrderId {
    return this._orderId;
  }

  /** The customer this payment was collected from. */
  get customerId(): CustomerId {
    return this._customerId;
  }

  /** The merchant this payment's funds are owed to. */
  get merchantId(): MerchantId {
    return this._merchantId;
  }

  /** The amount originally requested/authorized. */
  get amount(): Money {
    return this._amount;
  }

  /** The instrument category used for this payment. */
  get method(): PaymentMethod {
    return this._method;
  }

  /** The gateway processing this payment. */
  get provider(): PaymentProvider {
    return this._provider;
  }

  /** When this payment was created. */
  get createdAt(): Date {
    return this._createdAt;
  }

  /** The amount actually captured, once captured — `undefined` before capture. */
  get capturedAmount(): Money | undefined {
    return this._capturedAmount;
  }

  /** Why this payment failed, if it did — `undefined` otherwise. */
  get failureReason(): FailureReason | undefined {
    return this._failureReason;
  }

  /** A defensive copy of every refund (in any status) issued against this payment. */
  get refunds(): readonly Refund[] {
    return [...this._refunds];
  }

  /**
   * The portion of {@link Payment.capturedAmount} still available to refund,
   * after subtracting every pending or completed refund. Zero (in this
   * payment's currency) before capture.
   */
  get remainingRefundableAmount(): Money {
    return this._capturedAmount === undefined
      ? Money.zero(this._amount.currency)
      : calculateRemainingRefundableAmount(this._capturedAmount, this._refunds);
  }

  /**
   * Transitions this payment from `CREATED` to `AUTHORIZED` and raises
   * {@link PaymentAuthorized}.
   */
  authorize(
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Payment, InvalidPaymentStateTransitionError> {
    return this.transitionTo('AUTHORIZED').map((payment) => {
      payment.raiseEvent(new PaymentAuthorized(payment.buildEventProps(clock, uuidGenerator)));
      return payment;
    });
  }

  /**
   * Transitions this payment from `AUTHORIZED` to `CAPTURED`, records the
   * full authorized amount as {@link Payment.capturedAmount}, and raises
   * {@link PaymentCaptured}.
   *
   * Business rule: a payment can only be captured after authorization.
   */
  capture(
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Payment, InvalidPaymentStateTransitionError> {
    return this.transitionTo('CAPTURED').map((payment) => {
      payment._capturedAmount = payment._amount;
      payment.raiseEvent(
        new PaymentCaptured(payment.buildEventProps(clock, uuidGenerator), {
          capturedAmount: payment._capturedAmount.serialize(),
        }),
      );
      return payment;
    });
  }

  /**
   * Transitions this payment to `FAILED` and raises {@link PaymentFailed}.
   *
   * Only possible from `CREATED` or `AUTHORIZED` — a captured or already-
   * terminal payment cannot fail retroactively.
   */
  fail(
    reason: FailureReason,
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Payment, InvalidPaymentStateTransitionError> {
    return this.transitionTo('FAILED').map((payment) => {
      payment._failureReason = reason;
      payment.raiseEvent(
        new PaymentFailed(payment.buildEventProps(clock, uuidGenerator), { reason }),
      );
      return payment;
    });
  }

  /**
   * Transitions this payment to `CANCELLED` and raises {@link PaymentCancelled}.
   *
   * Only possible from `CREATED` or `AUTHORIZED`.
   */
  cancel(
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Payment, InvalidPaymentStateTransitionError> {
    return this.transitionTo('CANCELLED').map((payment) => {
      payment.raiseEvent(new PaymentCancelled(payment.buildEventProps(clock, uuidGenerator)));
      return payment;
    });
  }

  /**
   * Transitions this payment to `EXPIRED` and raises {@link PaymentExpired}.
   *
   * Only possible from `CREATED` or `AUTHORIZED`. Business rule: expired
   * payments cannot transition further — `EXPIRED` is terminal.
   */
  expire(
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Payment, InvalidPaymentStateTransitionError> {
    return this.transitionTo('EXPIRED').map((payment) => {
      payment.raiseEvent(new PaymentExpired(payment.buildEventProps(clock, uuidGenerator)));
      return payment;
    });
  }

  /**
   * Initiates a refund of `params.amount` against this payment's captured
   * amount and raises {@link RefundInitiated}.
   *
   * Business rules enforced:
   * - Only `CAPTURED` or `PARTIALLY_REFUNDED` payments can be refunded
   *   (failed, cancelled, and expired payments cannot).
   * - `params.amount` must share this payment's captured currency.
   * - `params.amount` must be strictly positive.
   * - `params.amount` must not exceed {@link Payment.remainingRefundableAmount}
   *   (over-refund prevention, accounting for other pending refunds too).
   *
   * This does **not** change {@link Payment.status} — the payment only
   * becomes `PARTIALLY_REFUNDED`/`REFUNDED` once the refund actually
   * {@link Payment.completeRefund | completes}.
   */
  initiateRefund(
    params: InitiateRefundParams,
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Refund, PaymentDomainError> {
    if (this._capturedAmount === undefined || !canInitiateRefund(this._status)) {
      return Result.fail(
        new InvalidPaymentStateTransitionError(this._status, 'PARTIALLY_REFUNDED'),
      );
    }
    if (!params.amount.currency.equals(this._capturedAmount.currency)) {
      return Result.fail(
        new CurrencyMismatchError(this._capturedAmount.currency.code, params.amount.currency.code),
      );
    }
    if (!params.amount.isPositive()) {
      return Result.fail(
        new InvalidRefundAmountError(params.amount.amountMinorUnits, params.amount.currency.code),
      );
    }

    const remaining = this.remainingRefundableAmount;
    if (params.amount.greaterThan(remaining)) {
      return Result.fail(
        new RefundExceedsRefundableAmountError(
          params.amount.amountMinorUnits,
          remaining.amountMinorUnits,
          params.amount.currency.code,
        ),
      );
    }

    const refund = Refund.create(
      params.reason === undefined
        ? { id: params.id, paymentId: this.id, amount: params.amount }
        : { id: params.id, paymentId: this.id, amount: params.amount, reason: params.reason },
      clock,
    );
    this._refunds.push(refund);
    this.raiseEvent(
      new RefundInitiated(this.buildEventProps(clock, uuidGenerator), {
        refundId: refund.id.value,
        amount: refund.amount.serialize(),
      }),
    );
    return Result.ok(refund);
  }

  /**
   * Completes a previously-{@link Payment.initiateRefund | initiated}
   * refund, raises {@link RefundCompleted}, and — once the sum of all
   * completed refunds reaches the captured amount — transitions this
   * payment's status to `REFUNDED` (or `PARTIALLY_REFUNDED` otherwise).
   */
  completeRefund(
    refundId: RefundId,
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Payment, PaymentDomainError> {
    const refund = this.findRefund(refundId);
    if (refund === undefined) {
      return Result.fail(new RefundNotFoundError(refundId.value));
    }

    const completed = refund.complete();
    if (completed.isFailure()) {
      return Result.fail(completed.error);
    }

    const completedTotal = calculateCompletedRefundAmount(this._refunds, this._amount.currency);
    const nextStatus: PaymentStatus = completedTotal.equals(this._capturedAmount)
      ? 'REFUNDED'
      : 'PARTIALLY_REFUNDED';

    if (nextStatus !== this._status) {
      // `canInitiateRefund` already guarantees the current status is
      // `CAPTURED` or `PARTIALLY_REFUNDED`, both of which permit both
      // `PARTIALLY_REFUNDED` and `REFUNDED` per `PAYMENT_STATUS_TRANSITIONS`
      // — this can only fail if that invariant is broken elsewhere.
      const transitioned = this.transitionTo(nextStatus);
      if (transitioned.isFailure()) {
        return Result.fail(transitioned.error);
      }
    }

    this.raiseEvent(
      new RefundCompleted(this.buildEventProps(clock, uuidGenerator), {
        refundId: refund.id.value,
        amount: refund.amount.serialize(),
      }),
    );
    return Result.ok(this);
  }

  /**
   * Marks a previously-{@link Payment.initiateRefund | initiated} refund as
   * failed and raises {@link RefundFailed}. Does not change this payment's
   * own status — the refunded amount is simply released back into
   * {@link Payment.remainingRefundableAmount}.
   */
  failRefund(
    refundId: RefundId,
    reason: FailureReason,
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): Result<Payment, PaymentDomainError> {
    const refund = this.findRefund(refundId);
    if (refund === undefined) {
      return Result.fail(new RefundNotFoundError(refundId.value));
    }

    const failed = refund.fail();
    if (failed.isFailure()) {
      return Result.fail(failed.error);
    }

    this.raiseEvent(
      new RefundFailed(this.buildEventProps(clock, uuidGenerator), {
        refundId: refund.id.value,
        reason,
      }),
    );
    return Result.ok(this);
  }

  /** Serializes to a plain, JSON-safe DTO suitable for persistence or API responses. */
  serialize(): PaymentDTO {
    return {
      id: this.id.value,
      orderId: this._orderId.value,
      customerId: this._customerId.value,
      merchantId: this._merchantId.value,
      amount: this._amount.serialize(),
      capturedAmount: this._capturedAmount?.serialize(),
      status: this._status,
      method: this._method,
      provider: this._provider,
      failureReason: this._failureReason,
      refunds: this._refunds.map((refund) => refund.serialize()),
      createdAt: this._createdAt.toISOString(),
    };
  }

  private findRefund(refundId: RefundId): Refund | undefined {
    return this._refunds.find((refund) => refund.id.equals(refundId));
  }

  private transitionTo(next: PaymentStatus): Result<this, InvalidPaymentStateTransitionError> {
    if (!canTransitionPaymentStatus(this._status, next)) {
      return Result.fail(new InvalidPaymentStateTransitionError(this._status, next));
    }
    this._status = next;
    return Result.ok(this);
  }

  private buildEventProps(
    clock: Clock,
    uuidGenerator: UuidGenerator,
  ): { eventId: string; occurredAt: Date; aggregateId: string } {
    return {
      eventId: uuidGenerator.generate(),
      occurredAt: clock.now(),
      aggregateId: this.id.value,
    };
  }
}
