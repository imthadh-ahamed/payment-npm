/**
 * Strongly typed enumerations for the Payment Domain, modeled as
 * string-literal unions backed by `as const` arrays rather than TypeScript
 * `enum`s — this keeps them tree-shakeable, produces no runtime object
 * unless the array is actually imported, and structurally widens to plain
 * strings at API boundaries without a cast.
 */

/**
 * The lifecycle status of a {@link Payment}.
 *
 * Valid transitions are enforced by
 * {@link PAYMENT_STATUS_TRANSITIONS} in `policies.ts`, not by this type —
 * this union only describes which values are structurally possible.
 */
export const PAYMENT_STATUSES = [
  'CREATED',
  'AUTHORIZED',
  'CAPTURED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
] as const;

/** @see {@link PAYMENT_STATUSES} */
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * The lifecycle status of a {@link Refund}. A refund starts `INITIATED` and
 * terminates at either `COMPLETED` or `FAILED` — both are final.
 */
export const REFUND_STATUSES = ['INITIATED', 'COMPLETED', 'FAILED'] as const;

/** @see {@link REFUND_STATUSES} */
export type RefundStatus = (typeof REFUND_STATUSES)[number];

/**
 * A provider-agnostic category of payment instrument. Concrete providers
 * map their own instrument types onto this set at the infrastructure layer.
 */
export const PAYMENT_METHODS = [
  'CARD',
  'UPI',
  'NET_BANKING',
  'WALLET',
  'BANK_TRANSFER',
  'OTHER',
] as const;

/** @see {@link PAYMENT_METHODS} */
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * The identity of the payment gateway processing a {@link Payment}. This is
 * a domain-level tag only — the Domain layer never depends on a provider's
 * SDK or API.
 */
export const PAYMENT_PROVIDERS = [
  'RAZORPAY',
  'STRIPE',
  'PAYPAL',
  'PAYU',
  'CASHFREE',
  'PHONEPE',
  'ADYEN',
  'CHECKOUT_COM',
  'SQUARE',
  'BRAINTREE',
  'WORLDPAY',
  'OTHER',
] as const;

/** @see {@link PAYMENT_PROVIDERS} */
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/**
 * The discriminant used as `eventName` on every {@link DomainEvent} raised
 * by the Payment Domain.
 */
export const PAYMENT_EVENT_TYPES = [
  'PaymentCreated',
  'PaymentAuthorized',
  'PaymentCaptured',
  'PaymentFailed',
  'PaymentCancelled',
  'PaymentExpired',
  'RefundInitiated',
  'RefundCompleted',
  'RefundFailed',
] as const;

/** @see {@link PAYMENT_EVENT_TYPES} */
export type PaymentEventType = (typeof PAYMENT_EVENT_TYPES)[number];

/**
 * A provider-agnostic category explaining why a payment or refund did not
 * succeed.
 */
export const FAILURE_REASONS = [
  'INSUFFICIENT_FUNDS',
  'CARD_DECLINED',
  'EXPIRED_CARD',
  'FRAUD_SUSPECTED',
  'PROCESSOR_ERROR',
  'TIMEOUT',
  'CUSTOMER_CANCELLED',
  'RISK_CHECK_FAILED',
  'UNKNOWN',
] as const;

/** @see {@link FAILURE_REASONS} */
export type FailureReason = (typeof FAILURE_REASONS)[number];
