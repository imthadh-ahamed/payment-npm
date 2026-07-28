import { describe, expect, it } from 'vitest';

import { Customer } from '../../src/domain/customer.js';
import { CustomerId } from '../../src/domain/identifiers.js';
import { ValidationError } from '../../src/shared/index.js';

const customerId = CustomerId.create('customer-1');

describe('Customer', () => {
  describe('create', () => {
    it('creates a customer with an email and optional name', () => {
      const customer = Customer.create({ id: customerId, email: 'jane@example.com', name: 'Jane' });
      expect(customer.email).toBe('jane@example.com');
      expect(customer.name).toBe('Jane');
    });

    it('creates a customer without a name', () => {
      const customer = Customer.create({ id: customerId, email: 'jane@example.com' });
      expect(customer.name).toBeUndefined();
    });

    it('throws ValidationError for a blank email', () => {
      expect(() => Customer.create({ id: customerId, email: '' })).toThrow(ValidationError);
    });

    it('throws ValidationError for a syntactically invalid email', () => {
      expect(() => Customer.create({ id: customerId, email: 'not-an-email' })).toThrow(
        ValidationError,
      );
    });
  });

  describe('updateEmail', () => {
    it('updates the email to a new valid value', () => {
      const customer = Customer.create({ id: customerId, email: 'old@example.com' });
      customer.updateEmail('new@example.com');
      expect(customer.email).toBe('new@example.com');
    });

    it('throws ValidationError and leaves the email unchanged for an invalid value', () => {
      const customer = Customer.create({ id: customerId, email: 'old@example.com' });
      expect(() => {
        customer.updateEmail('not-an-email');
      }).toThrow(ValidationError);
      expect(customer.email).toBe('old@example.com');
    });
  });

  describe('rename', () => {
    it('updates the display name', () => {
      const customer = Customer.create({ id: customerId, email: 'jane@example.com', name: 'Jane' });
      customer.rename('Janet');
      expect(customer.name).toBe('Janet');
    });

    it('clears the display name when given undefined', () => {
      const customer = Customer.create({ id: customerId, email: 'jane@example.com', name: 'Jane' });
      // eslint-disable-next-line unicorn/no-useless-undefined -- argument is required
      customer.rename(undefined);
      expect(customer.name).toBeUndefined();
    });
  });

  describe('identity', () => {
    it('two customers with the same id are equal regardless of other state', () => {
      const a = Customer.create({ id: customerId, email: 'a@example.com' });
      const b = Customer.create({ id: customerId, email: 'b@example.com' });
      expect(a.equals(b)).toBe(true);
    });
  });

  describe('serialize', () => {
    it('serializes to a plain DTO', () => {
      const customer = Customer.create({ id: customerId, email: 'jane@example.com', name: 'Jane' });
      expect(customer.serialize()).toEqual({
        id: 'customer-1',
        email: 'jane@example.com',
        name: 'Jane',
      });
    });
  });
});
