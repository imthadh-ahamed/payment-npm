import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/shared/errors.js';
import { Identifier } from '../../src/shared/identifier.js';
import { MockUuidGenerator } from '../../src/shared/uuid.js';

describe('Identifier', () => {
  describe('create', () => {
    it('wraps a non-blank string value', () => {
      const id = Identifier.create<'Widget'>('11111111-1111-4111-8111-111111111111');
      expect(id.value).toBe('11111111-1111-4111-8111-111111111111');
    });

    it('throws ValidationError for a blank value', () => {
      expect(() => Identifier.create<'Widget'>('   ')).toThrow(ValidationError);
    });
  });

  describe('generate', () => {
    it('delegates to the provided UuidGenerator', () => {
      const uuids = new MockUuidGenerator(['22222222-2222-4222-8222-222222222222']);
      const id = Identifier.generate<'Widget'>(uuids);
      expect(id.value).toBe('22222222-2222-4222-8222-222222222222');
    });
  });

  describe('equals', () => {
    it('returns true for two identifiers with the same value', () => {
      const a = Identifier.create<'Widget'>('same-value');
      const b = Identifier.create<'Widget'>('same-value');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for identifiers with different values', () => {
      const a = Identifier.create<'Widget'>('value-a');
      const b = Identifier.create<'Widget'>('value-b');
      expect(a.equals(b)).toBe(false);
    });

    it('returns false when compared to null or undefined', () => {
      const a = Identifier.create<'Widget'>('value-a');
      expect(a.equals(null)).toBe(false);
      // eslint-disable-next-line unicorn/no-useless-undefined -- argument is required
      expect(a.equals(undefined)).toBe(false);
    });

    it('returns false when compared to a non-Identifier value', () => {
      const a = Identifier.create<'Widget'>('value-a');
      expect(a.equals({ value: 'value-a' } as unknown as Identifier<'Widget'>)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('toString() returns the underlying value', () => {
      const id = Identifier.create<'Widget'>('the-value');
      expect(id.toString()).toBe('the-value');
    });

    it('toJSON() returns the underlying value', () => {
      const id = Identifier.create<'Widget'>('the-value');
      expect(id.toJSON()).toBe('the-value');
      expect(JSON.stringify({ id })).toBe('{"id":"the-value"}');
    });
  });
});
