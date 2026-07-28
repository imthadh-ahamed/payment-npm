import { describe, expect, it } from 'vitest';

import { Currency } from '../../src/domain/currency.js';
import { CurrencyMismatchError } from '../../src/domain/errors.js';
import { Money } from '../../src/domain/money.js';
import { ValidationError } from '../../src/shared/index.js';

const usd = Currency.create('USD');
const eur = Currency.create('EUR');
const jpy = Currency.create('JPY');

describe('Money', () => {
  describe('fromMinor', () => {
    it('stores the exact integer minor-unit amount', () => {
      expect(Money.fromMinor(1999, usd).amountMinorUnits).toBe(1999);
    });

    it('throws ValidationError for a non-integer amount', () => {
      expect(() => Money.fromMinor(19.99, usd)).toThrow(ValidationError);
    });
  });

  describe('fromMajor', () => {
    it('converts a decimal major-unit amount without float drift', () => {
      expect(Money.fromMajor(19.99, usd).amountMinorUnits).toBe(1999);
    });

    it('rounds to the nearest minor unit', () => {
      expect(Money.fromMajor(10.005, usd).amountMinorUnits).toBe(1001);
    });

    it('respects a currency with zero decimal places', () => {
      expect(Money.fromMajor(500, jpy).amountMinorUnits).toBe(500);
    });

    it('throws ValidationError for a non-finite amount', () => {
      expect(() => Money.fromMajor(Number.POSITIVE_INFINITY, usd)).toThrow(ValidationError);
      expect(() => Money.fromMajor(Number.NaN, usd)).toThrow(ValidationError);
    });
  });

  describe('zero', () => {
    it('creates a zero-amount Money in the given currency', () => {
      const zero = Money.zero(usd);
      expect(zero.amountMinorUnits).toBe(0);
      expect(zero.currency.equals(usd)).toBe(true);
    });
  });

  describe('amountMajor', () => {
    it('converts minor units back to major units', () => {
      expect(Money.fromMinor(1999, usd).amountMajor).toBe(19.99);
    });

    it('returns the same value for a zero-decimal currency', () => {
      expect(Money.fromMinor(500, jpy).amountMajor).toBe(500);
    });
  });

  describe('add', () => {
    it('adds two amounts in the same currency', () => {
      const total = Money.fromMinor(1000, usd).add(Money.fromMinor(250, usd));
      expect(total.amountMinorUnits).toBe(1250);
    });

    it('avoids floating-point drift across many additions', () => {
      let total = Money.zero(usd);
      for (let i = 0; i < 10; i += 1) {
        total = total.add(Money.fromMajor(0.1, usd));
      }
      expect(total.amountMinorUnits).toBe(100);
      expect(total.amountMajor).toBe(1);
    });

    it('throws CurrencyMismatchError for mismatched currencies', () => {
      expect(() => Money.fromMinor(100, usd).add(Money.fromMinor(100, eur))).toThrow(
        CurrencyMismatchError,
      );
    });
  });

  describe('subtract', () => {
    it('subtracts two amounts in the same currency', () => {
      const remaining = Money.fromMinor(1000, usd).subtract(Money.fromMinor(250, usd));
      expect(remaining.amountMinorUnits).toBe(750);
    });

    it('allows the result to go negative', () => {
      const result = Money.fromMinor(100, usd).subtract(Money.fromMinor(250, usd));
      expect(result.amountMinorUnits).toBe(-150);
    });

    it('throws CurrencyMismatchError for mismatched currencies', () => {
      expect(() => Money.fromMinor(100, usd).subtract(Money.fromMinor(100, eur))).toThrow(
        CurrencyMismatchError,
      );
    });
  });

  describe('multiply', () => {
    it('multiplies the amount by a factor, rounding to the nearest minor unit', () => {
      expect(Money.fromMinor(100, usd).multiply(3).amountMinorUnits).toBe(300);
      expect(Money.fromMinor(100, usd).multiply(1.5).amountMinorUnits).toBe(150);
      expect(Money.fromMinor(10, usd).multiply(0.333).amountMinorUnits).toBe(3);
    });

    it('throws ValidationError for a non-finite factor', () => {
      expect(() => Money.fromMinor(100, usd).multiply(Number.NaN)).toThrow(ValidationError);
    });
  });

  describe('comparisons', () => {
    it('greaterThan returns true when this amount is larger', () => {
      expect(Money.fromMinor(200, usd).greaterThan(Money.fromMinor(100, usd))).toBe(true);
      expect(Money.fromMinor(100, usd).greaterThan(Money.fromMinor(200, usd))).toBe(false);
      expect(Money.fromMinor(100, usd).greaterThan(Money.fromMinor(100, usd))).toBe(false);
    });

    it('lessThan returns true when this amount is smaller', () => {
      expect(Money.fromMinor(100, usd).lessThan(Money.fromMinor(200, usd))).toBe(true);
      expect(Money.fromMinor(200, usd).lessThan(Money.fromMinor(100, usd))).toBe(false);
    });

    it('greaterThan and lessThan throw CurrencyMismatchError for mismatched currencies', () => {
      expect(() => Money.fromMinor(100, usd).greaterThan(Money.fromMinor(100, eur))).toThrow(
        CurrencyMismatchError,
      );
      expect(() => Money.fromMinor(100, usd).lessThan(Money.fromMinor(100, eur))).toThrow(
        CurrencyMismatchError,
      );
    });
  });

  describe('predicates', () => {
    it('isZero reflects whether the amount is exactly zero', () => {
      expect(Money.zero(usd).isZero()).toBe(true);
      expect(Money.fromMinor(1, usd).isZero()).toBe(false);
    });

    it('isPositive reflects whether the amount is strictly greater than zero', () => {
      expect(Money.fromMinor(1, usd).isPositive()).toBe(true);
      expect(Money.zero(usd).isPositive()).toBe(false);
      expect(Money.fromMinor(-1, usd).isPositive()).toBe(false);
    });

    it('isNegative reflects whether the amount is strictly less than zero', () => {
      expect(Money.fromMinor(-1, usd).isNegative()).toBe(true);
      expect(Money.zero(usd).isNegative()).toBe(false);
    });
  });

  describe('equals', () => {
    it('treats equal amounts in the same currency as equal', () => {
      expect(Money.fromMinor(100, usd).equals(Money.fromMinor(100, usd))).toBe(true);
    });

    it('treats equal amounts in different currencies as unequal', () => {
      expect(Money.fromMinor(100, usd).equals(Money.fromMinor(100, eur))).toBe(false);
    });

    it('treats different amounts as unequal', () => {
      expect(Money.fromMinor(100, usd).equals(Money.fromMinor(200, usd))).toBe(false);
    });
  });

  describe('serialize', () => {
    it('serializes to a plain amount/currency DTO', () => {
      expect(Money.fromMinor(1999, usd).serialize()).toEqual({
        amountMinorUnits: 1999,
        currency: 'USD',
      });
    });
  });
});
