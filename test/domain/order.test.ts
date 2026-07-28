import { describe, expect, it } from 'vitest';

import { Currency } from '../../src/domain/currency.js';
import { InvalidPaymentAmountError } from '../../src/domain/errors.js';
import { CustomerId, MerchantId, OrderId } from '../../src/domain/identifiers.js';
import { Money } from '../../src/domain/money.js';
import { Order } from '../../src/domain/order.js';
import { MockClock } from '../../src/shared/index.js';

const usd = Currency.create('USD');
const orderId = OrderId.create('order-1');
const merchantId = MerchantId.create('merchant-1');
const customerId = CustomerId.create('customer-1');

describe('Order', () => {
  describe('create', () => {
    it('creates an order with the given amount and parties', () => {
      const clock = new MockClock(new Date('2024-01-01T00:00:00.000Z'));
      const order = Order.create(
        { id: orderId, merchantId, customerId, amount: Money.fromMajor(49.99, usd) },
        clock,
      );
      expect(order.amount.amountMinorUnits).toBe(4999);
      expect(order.merchantId.equals(merchantId)).toBe(true);
      expect(order.customerId.equals(customerId)).toBe(true);
      expect(order.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    });

    it('throws InvalidPaymentAmountError for a zero amount', () => {
      const clock = new MockClock();
      expect(() =>
        Order.create({ id: orderId, merchantId, customerId, amount: Money.zero(usd) }, clock),
      ).toThrow(InvalidPaymentAmountError);
    });

    it('throws InvalidPaymentAmountError for a negative amount', () => {
      const clock = new MockClock();
      expect(() =>
        Order.create(
          { id: orderId, merchantId, customerId, amount: Money.fromMinor(-100, usd) },
          clock,
        ),
      ).toThrow(InvalidPaymentAmountError);
    });
  });

  describe('belongsToCustomer', () => {
    it('returns true for the owning customer', () => {
      const order = Order.create(
        { id: orderId, merchantId, customerId, amount: Money.fromMajor(10, usd) },
        new MockClock(),
      );
      expect(order.belongsToCustomer(customerId)).toBe(true);
    });

    it('returns false for a different customer', () => {
      const order = Order.create(
        { id: orderId, merchantId, customerId, amount: Money.fromMajor(10, usd) },
        new MockClock(),
      );
      expect(order.belongsToCustomer(CustomerId.create('someone-else'))).toBe(false);
    });
  });

  describe('serialize', () => {
    it('serializes to a plain DTO', () => {
      const clock = new MockClock(new Date('2024-01-01T00:00:00.000Z'));
      const order = Order.create(
        { id: orderId, merchantId, customerId, amount: Money.fromMajor(10, usd) },
        clock,
      );
      expect(order.serialize()).toEqual({
        id: 'order-1',
        merchantId: 'merchant-1',
        customerId: 'customer-1',
        amount: { amountMinorUnits: 1000, currency: 'USD' },
        createdAt: '2024-01-01T00:00:00.000Z',
      });
    });
  });
});
