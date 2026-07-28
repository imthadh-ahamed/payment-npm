/**
 * The {@link Order} entity.
 */
import { Entity, Guard, type Clock } from '../shared/index.js';

import { InvalidPaymentAmountError } from './errors.js';
import type { CustomerId, MerchantId, OrderId } from './identifiers.js';
import type { Money, MoneyDTO } from './money.js';

/** The plain-object shape produced by {@link Order.serialize}. */
export interface OrderDTO {
  readonly id: string;
  readonly merchantId: string;
  readonly customerId: string;
  readonly amount: MoneyDTO;
  readonly createdAt: string;
}

/** Parameters accepted by {@link Order.create}. */
export interface OrderCreateParams {
  readonly id: OrderId;
  readonly merchantId: MerchantId;
  readonly customerId: CustomerId;
  readonly amount: Money;
}

/**
 * The thing a {@link Payment} is collected for. `Order` records the total
 * amount owed by a customer to a merchant; it does not model a cart,
 * catalog, or line items — those are outside the payment platform's scope.
 *
 * An order's amount and parties are fixed at creation and never change.
 */
export class Order extends Entity<OrderId> {
  private readonly _merchantId: MerchantId;
  private readonly _customerId: CustomerId;
  private readonly _amount: Money;
  private readonly _createdAt: Date;

  private constructor(params: OrderCreateParams, createdAt: Date) {
    super(params.id);
    this._merchantId = params.merchantId;
    this._customerId = params.customerId;
    this._amount = params.amount;
    this._createdAt = createdAt;
  }

  /**
   * Creates a new {@link Order}.
   *
   * @throws {@link InvalidPaymentAmountError} if `params.amount` is not strictly positive.
   */
  static create(params: OrderCreateParams, clock: Clock): Order {
    Guard.notNull(params.amount, 'amount');
    if (!params.amount.isPositive()) {
      throw new InvalidPaymentAmountError(
        params.amount.amountMinorUnits,
        params.amount.currency.code,
      );
    }
    return new Order(params, clock.now());
  }

  /** The merchant the order's amount is owed to. */
  get merchantId(): MerchantId {
    return this._merchantId;
  }

  /** The customer who owes the order's amount. */
  get customerId(): CustomerId {
    return this._customerId;
  }

  /** The total amount owed for this order. */
  get amount(): Money {
    return this._amount;
  }

  /** When this order was created. */
  get createdAt(): Date {
    return this._createdAt;
  }

  /** Whether this order belongs to the given customer. */
  belongsToCustomer(customerId: CustomerId): boolean {
    return this._customerId.equals(customerId);
  }

  /** Serializes to a plain, JSON-safe DTO suitable for persistence or API responses. */
  serialize(): OrderDTO {
    return {
      id: this.id.value,
      merchantId: this._merchantId.value,
      customerId: this._customerId.value,
      amount: this._amount.serialize(),
      createdAt: this._createdAt.toISOString(),
    };
  }
}
