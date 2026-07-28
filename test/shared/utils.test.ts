import { describe, expect, it } from 'vitest';

import { InternalError, ValidationError } from '../../src/shared/errors.js';
import {
  deepFreeze,
  objectEquals,
  safeJsonParse,
  safeJsonStringify,
} from '../../src/shared/utils.js';

describe('deepFreeze', () => {
  it('freezes a top-level object', () => {
    const frozen = deepFreeze({ count: 1 });
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it('recursively freezes nested objects', () => {
    const frozen = deepFreeze({ nested: { count: 1 } });
    expect(Object.isFrozen(frozen.nested)).toBe(true);
  });

  it('recursively freezes arrays and their contents', () => {
    const frozen = deepFreeze({ items: [{ id: 1 }] });
    expect(Object.isFrozen(frozen.items)).toBe(true);
    expect(Object.isFrozen(frozen.items[0])).toBe(true);
  });

  it('returns primitives unchanged', () => {
    expect(deepFreeze(42)).toBe(42);
    expect(deepFreeze('text')).toBe('text');
    expect(deepFreeze(null)).toBeNull();
    // The `undefined` argument is required (deepFreeze<undefined> legitimately
    // returns `undefined`, not `void`), unlike ESLint's default heuristics here.
    // eslint-disable-next-line unicorn/no-useless-undefined, @typescript-eslint/no-confusing-void-expression
    const frozenUndefined = deepFreeze(undefined);
    expect(frozenUndefined).toBeUndefined();
  });

  it('is a no-op on an already-frozen object', () => {
    const already = Object.freeze({ count: 1 });
    expect(deepFreeze(already)).toBe(already);
  });
});

describe('objectEquals', () => {
  it('returns true for identical primitives', () => {
    expect(objectEquals(1, 1)).toBe(true);
    expect(objectEquals('a', 'a')).toBe(true);
    expect(objectEquals(null, null)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(objectEquals(1, 2)).toBe(false);
    expect(objectEquals('a', 'b')).toBe(false);
  });

  it('treats NaN as equal to itself', () => {
    expect(objectEquals(Number.NaN, Number.NaN)).toBe(true);
  });

  it('returns false when comparing an object to a primitive', () => {
    expect(objectEquals({ a: 1 }, 1)).toBe(false);
    expect(objectEquals(null, { a: 1 })).toBe(false);
  });

  it('returns true for deeply equal plain objects', () => {
    expect(objectEquals({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
  });

  it('returns false for objects with different keys', () => {
    expect(objectEquals({ a: 1 }, { b: 1 })).toBe(false);
  });

  it('returns false for objects with a different number of keys', () => {
    expect(objectEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('returns false for objects with the same keys but different values', () => {
    expect(objectEquals({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('returns true for deeply equal arrays', () => {
    expect(objectEquals([1, { a: 2 }], [1, { a: 2 }])).toBe(true);
  });

  it('returns false for arrays of different lengths', () => {
    expect(objectEquals([1, 2], [1])).toBe(false);
  });

  it('returns false when comparing an array to a plain object', () => {
    expect(objectEquals([1, 2], { 0: 1, 1: 2 })).toBe(false);
  });
});

describe('safeJsonParse', () => {
  it('returns a Success with the parsed value for valid JSON', () => {
    const result = safeJsonParse<{ id: string }>('{"id":"abc"}');
    expect(result.isSuccess()).toBe(true);
    expect(result.unwrap()).toEqual({ id: 'abc' });
  });

  it('returns a Failure carrying a ValidationError for malformed JSON', () => {
    const result = safeJsonParse('{not valid json');
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(ValidationError);
  });
});

describe('safeJsonStringify', () => {
  it('returns a Success with the JSON string for a serializable value', () => {
    const result = safeJsonStringify({ id: 'abc' });
    expect(result.unwrap()).toBe('{"id":"abc"}');
  });

  it('supports an indentation width', () => {
    const result = safeJsonStringify({ id: 'abc' }, 2);
    expect(result.unwrap()).toBe('{\n  "id": "abc"\n}');
  });

  it('returns a Failure carrying an InternalError for a circular reference', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    const result = safeJsonStringify(circular);
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(InternalError);
  });

  it('returns a Failure carrying an InternalError for a non-serializable top-level value', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined -- argument is required
    const result = safeJsonStringify(undefined);
    expect(result.isFailure()).toBe(true);
    expect(
      result.fold(
        () => null,
        (error) => error,
      ),
    ).toBeInstanceOf(InternalError);
  });
});
