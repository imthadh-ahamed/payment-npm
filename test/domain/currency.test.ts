import { describe, expect, it } from 'vitest';

import { Currency } from '../../src/domain/currency.js';
import { ValidationError } from '../../src/shared/index.js';

describe('Currency', () => {
  describe('create', () => {
    it('creates a currency from a valid three-letter code', () => {
      const usd = Currency.create('USD');
      expect(usd.code).toBe('USD');
    });

    it('normalizes lowercase input to uppercase', () => {
      const usd = Currency.create('usd');
      expect(usd.code).toBe('USD');
    });

    it('throws ValidationError for a blank code', () => {
      expect(() => Currency.create('')).toThrow(ValidationError);
    });

    it('throws ValidationError for a code that is not three letters', () => {
      expect(() => Currency.create('US')).toThrow(ValidationError);
      expect(() => Currency.create('USDT')).toThrow(ValidationError);
    });

    it('throws ValidationError for a code containing digits', () => {
      expect(() => Currency.create('U5D')).toThrow(ValidationError);
    });
  });

  describe('minorUnitExponent', () => {
    it('returns 2 for typical currencies', () => {
      expect(Currency.create('USD').minorUnitExponent).toBe(2);
      expect(Currency.create('EUR').minorUnitExponent).toBe(2);
      expect(Currency.create('INR').minorUnitExponent).toBe(2);
    });

    it('returns 0 for zero-decimal currencies', () => {
      expect(Currency.create('JPY').minorUnitExponent).toBe(0);
      expect(Currency.create('KRW').minorUnitExponent).toBe(0);
    });

    it('returns 3 for three-decimal currencies', () => {
      expect(Currency.create('KWD').minorUnitExponent).toBe(3);
      expect(Currency.create('BHD').minorUnitExponent).toBe(3);
    });
  });

  describe('equality', () => {
    it('treats two currencies with the same code as equal', () => {
      expect(Currency.create('USD').equals(Currency.create('USD'))).toBe(true);
    });

    it('treats two currencies with different codes as unequal', () => {
      expect(Currency.create('USD').equals(Currency.create('EUR'))).toBe(false);
    });
  });

  describe('serialize', () => {
    it('serializes to the ISO 4217 code string', () => {
      expect(Currency.create('USD').serialize()).toBe('USD');
    });
  });
});
