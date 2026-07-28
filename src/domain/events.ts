/**
 * Domain events raised by the {@link Payment} aggregate. Each extends the
 * Shared Kernel's {@link DomainEvent} and is constructed with props
 * (`eventId`, `occurredAt`, `aggregateId`) supplied by the caller — the
 * aggregate builds these via an injected `Clock` and `UuidGenerator`, never
 * by calling `Date.now()` or a UUID library directly.
 */
import { DomainEvent, type DomainEventProps } from '../shared/index.js';

import type { FailureReason, PaymentEventType } from './enums.js';
import type { MoneyDTO } from './money.js';

/** Raised when a new {@link Payment} is created in the `CREATED` status. */
export class PaymentCreated extends DomainEvent {
  override readonly eventName: PaymentEventType = 'PaymentCreated';

  constructor(
    props: DomainEventProps,
    readonly payload: {
      readonly amount: MoneyDTO;
      readonly orderId: string;
      readonly customerId: string;
      readonly merchantId: string;
    },
  ) {
    super(props);
  }
}

/** Raised when a {@link Payment} transitions from `CREATED` to `AUTHORIZED`. */
export class PaymentAuthorized extends DomainEvent {
  override readonly eventName: PaymentEventType = 'PaymentAuthorized';

  public constructor(props: DomainEventProps) {
    super(props);
  }
}

/** Raised when a {@link Payment} transitions from `AUTHORIZED` to `CAPTURED`. */
export class PaymentCaptured extends DomainEvent {
  override readonly eventName: PaymentEventType = 'PaymentCaptured';

  constructor(
    props: DomainEventProps,
    readonly payload: { readonly capturedAmount: MoneyDTO },
  ) {
    super(props);
  }
}

/** Raised when a {@link Payment} transitions to `FAILED`. */
export class PaymentFailed extends DomainEvent {
  override readonly eventName: PaymentEventType = 'PaymentFailed';

  constructor(
    props: DomainEventProps,
    readonly payload: { readonly reason: FailureReason },
  ) {
    super(props);
  }
}

/** Raised when a {@link Payment} transitions to `CANCELLED`. */
export class PaymentCancelled extends DomainEvent {
  override readonly eventName: PaymentEventType = 'PaymentCancelled';

  public constructor(props: DomainEventProps) {
    super(props);
  }
}

/** Raised when a {@link Payment} transitions to `EXPIRED`. */
export class PaymentExpired extends DomainEvent {
  override readonly eventName: PaymentEventType = 'PaymentExpired';

  public constructor(props: DomainEventProps) {
    super(props);
  }
}

/** Raised when a {@link Refund} is initiated against a {@link Payment}. */
export class RefundInitiated extends DomainEvent {
  override readonly eventName: PaymentEventType = 'RefundInitiated';

  constructor(
    props: DomainEventProps,
    readonly payload: { readonly refundId: string; readonly amount: MoneyDTO },
  ) {
    super(props);
  }
}

/** Raised when a previously-initiated {@link Refund} completes successfully. */
export class RefundCompleted extends DomainEvent {
  override readonly eventName: PaymentEventType = 'RefundCompleted';

  constructor(
    props: DomainEventProps,
    readonly payload: { readonly refundId: string; readonly amount: MoneyDTO },
  ) {
    super(props);
  }
}

/** Raised when a previously-initiated {@link Refund} fails. */
export class RefundFailed extends DomainEvent {
  override readonly eventName: PaymentEventType = 'RefundFailed';

  constructor(
    props: DomainEventProps,
    readonly payload: { readonly refundId: string; readonly reason: FailureReason },
  ) {
    super(props);
  }
}
