/**
 * Public API of the Payment Domain: the business language of the payment
 * platform, independent of any provider, framework, or infrastructure.
 * This barrel is the only file outside `src/domain` that other layers
 * should import from — internal helper modules are intentionally not
 * re-exported here.
 */

export {
  FAILURE_REASONS,
  PAYMENT_EVENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  REFUND_STATUSES,
} from './enums.js';
export type {
  FailureReason,
  PaymentEventType,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
} from './enums.js';

export { CustomerId, MerchantId, OrderId, PaymentId, RefundId } from './identifiers.js';

export {
  CurrencyMismatchError,
  InvalidPaymentAmountError,
  InvalidPaymentStateTransitionError,
  InvalidRefundAmountError,
  InvalidRefundStateTransitionError,
  RefundExceedsRefundableAmountError,
  RefundNotFoundError,
} from './errors.js';
export type { PaymentDomainError } from './errors.js';

export { Currency } from './currency.js';
export { Money } from './money.js';
export type { MoneyDTO } from './money.js';

export {
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

export {
  PAYMENT_STATUS_TRANSITIONS,
  calculateCompletedRefundAmount,
  calculateRemainingRefundableAmount,
  calculateReservedRefundAmount,
  canCapturePayment,
  canInitiateRefund,
  canTransitionPaymentStatus,
} from './policies.js';

export { Customer } from './customer.js';
export type { CustomerCreateParams, CustomerDTO } from './customer.js';

export { Order } from './order.js';
export type { OrderCreateParams, OrderDTO } from './order.js';

export { Refund } from './refund.js';
export type { RefundCreateParams, RefundDTO } from './refund.js';

export { Payment } from './payment.js';
export type { InitiateRefundParams, PaymentCreateParams, PaymentDTO } from './payment.js';
