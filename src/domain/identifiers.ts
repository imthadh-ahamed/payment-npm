/**
 * Nominally-typed identifiers for every entity in the Payment Domain,
 * built on the Shared Kernel's {@link Identifier}. Each export pairs a
 * type alias (for use in signatures) with a same-named factory namespace
 * (for construction), the same pattern the Shared Kernel uses for `Result`.
 */
import { Identifier, type UuidGenerator } from '../shared/index.js';

/** Identifies a {@link Customer}. */
export type CustomerId = Identifier<'Customer'>;

/** Factory functions for {@link CustomerId}. */
export const CustomerId = {
  /** Wraps an existing, non-blank string value as a {@link CustomerId}. */
  create: (value: string): CustomerId => Identifier.create<'Customer'>(value),
  /** Generates a new {@link CustomerId} using the given {@link UuidGenerator}. */
  generate: (uuidGenerator: UuidGenerator): CustomerId =>
    Identifier.generate<'Customer'>(uuidGenerator),
} as const;

/** Identifies an {@link Order}. */
export type OrderId = Identifier<'Order'>;

/** Factory functions for {@link OrderId}. */
export const OrderId = {
  /** Wraps an existing, non-blank string value as an {@link OrderId}. */
  create: (value: string): OrderId => Identifier.create<'Order'>(value),
  /** Generates a new {@link OrderId} using the given {@link UuidGenerator}. */
  generate: (uuidGenerator: UuidGenerator): OrderId => Identifier.generate<'Order'>(uuidGenerator),
} as const;

/** Identifies a {@link Payment}. */
export type PaymentId = Identifier<'Payment'>;

/** Factory functions for {@link PaymentId}. */
export const PaymentId = {
  /** Wraps an existing, non-blank string value as a {@link PaymentId}. */
  create: (value: string): PaymentId => Identifier.create<'Payment'>(value),
  /** Generates a new {@link PaymentId} using the given {@link UuidGenerator}. */
  generate: (uuidGenerator: UuidGenerator): PaymentId =>
    Identifier.generate<'Payment'>(uuidGenerator),
} as const;

/** Identifies a {@link Refund}. */
export type RefundId = Identifier<'Refund'>;

/** Factory functions for {@link RefundId}. */
export const RefundId = {
  /** Wraps an existing, non-blank string value as a {@link RefundId}. */
  create: (value: string): RefundId => Identifier.create<'Refund'>(value),
  /** Generates a new {@link RefundId} using the given {@link UuidGenerator}. */
  generate: (uuidGenerator: UuidGenerator): RefundId =>
    Identifier.generate<'Refund'>(uuidGenerator),
} as const;

/** Identifies a Merchant (the recipient of a payment). */
export type MerchantId = Identifier<'Merchant'>;

/** Factory functions for {@link MerchantId}. */
export const MerchantId = {
  /** Wraps an existing, non-blank string value as a {@link MerchantId}. */
  create: (value: string): MerchantId => Identifier.create<'Merchant'>(value),
  /** Generates a new {@link MerchantId} using the given {@link UuidGenerator}. */
  generate: (uuidGenerator: UuidGenerator): MerchantId =>
    Identifier.generate<'Merchant'>(uuidGenerator),
} as const;
