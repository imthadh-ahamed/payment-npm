import { describe, expect, it } from 'vitest';

import {
  CustomerId,
  MerchantId,
  OrderId,
  PaymentId,
  RefundId,
} from '../../src/domain/identifiers.js';
import { MockUuidGenerator } from '../../src/shared/index.js';

describe('CustomerId', () => {
  it('create() wraps an existing string value', () => {
    expect(CustomerId.create('customer-1').value).toBe('customer-1');
  });

  it('generate() delegates to the provided UuidGenerator', () => {
    const uuidGenerator = new MockUuidGenerator(['11111111-1111-4111-8111-111111111111']);
    expect(CustomerId.generate(uuidGenerator).value).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('two ids created from the same value are equal', () => {
    expect(CustomerId.create('same').equals(CustomerId.create('same'))).toBe(true);
  });
});

describe('OrderId', () => {
  it('create() wraps an existing string value', () => {
    expect(OrderId.create('order-1').value).toBe('order-1');
  });

  it('generate() delegates to the provided UuidGenerator', () => {
    const uuidGenerator = new MockUuidGenerator(['22222222-2222-4222-8222-222222222222']);
    expect(OrderId.generate(uuidGenerator).value).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('two ids created from the same value are equal', () => {
    expect(OrderId.create('same').equals(OrderId.create('same'))).toBe(true);
  });
});

describe('PaymentId', () => {
  it('create() wraps an existing string value', () => {
    expect(PaymentId.create('payment-1').value).toBe('payment-1');
  });

  it('generate() delegates to the provided UuidGenerator', () => {
    const uuidGenerator = new MockUuidGenerator(['33333333-3333-4333-8333-333333333333']);
    expect(PaymentId.generate(uuidGenerator).value).toBe('33333333-3333-4333-8333-333333333333');
  });

  it('two ids created from the same value are equal', () => {
    expect(PaymentId.create('same').equals(PaymentId.create('same'))).toBe(true);
  });
});

describe('RefundId', () => {
  it('create() wraps an existing string value', () => {
    expect(RefundId.create('refund-1').value).toBe('refund-1');
  });

  it('generate() delegates to the provided UuidGenerator', () => {
    const uuidGenerator = new MockUuidGenerator(['44444444-4444-4444-8444-444444444444']);
    expect(RefundId.generate(uuidGenerator).value).toBe('44444444-4444-4444-8444-444444444444');
  });

  it('two ids created from the same value are equal', () => {
    expect(RefundId.create('same').equals(RefundId.create('same'))).toBe(true);
  });
});

describe('MerchantId', () => {
  it('create() wraps an existing string value', () => {
    expect(MerchantId.create('merchant-1').value).toBe('merchant-1');
  });

  it('generate() delegates to the provided UuidGenerator', () => {
    const uuidGenerator = new MockUuidGenerator(['55555555-5555-4555-8555-555555555555']);
    expect(MerchantId.generate(uuidGenerator).value).toBe('55555555-5555-4555-8555-555555555555');
  });

  it('two ids created from the same value are equal', () => {
    expect(MerchantId.create('same').equals(MerchantId.create('same'))).toBe(true);
  });
});
