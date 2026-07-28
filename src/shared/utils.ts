/**
 * Small, pure, dependency-free utility functions used across layers.
 */
import { InternalError, ValidationError } from './errors.js';
import { Result } from './result.js';
import type { JsonValue } from './types.js';

/**
 * Recursively freezes `value` and every nested object/array it contains,
 * returning the same reference typed as deeply readonly. Primitives are
 * returned unchanged.
 *
 * @example
 * ```ts
 * const frozen = deepFreeze({ nested: { count: 1 } });
 * frozen.nested.count = 2; // Throws in strict mode; no-op otherwise.
 * ```
 */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  for (const propertyValue of Object.values(value as Record<string, unknown>)) {
    deepFreeze(propertyValue);
  }

  return Object.freeze(value);
}

/**
 * Performs a deep, structural equality comparison between two values.
 * Primitives are compared with `Object.is`; plain objects and arrays are
 * compared key-by-key/element-by-element.
 *
 * @example
 * ```ts
 * objectEquals({ a: [1, 2] }, { a: [1, 2] }); // true
 * ```
 */
export function objectEquals(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => objectEquals(item, b[index]));
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => Object.hasOwn(right, key) && objectEquals(left[key], right[key]));
}

/**
 * Parses a JSON string without throwing — failures are returned as a
 * {@link Result} failure carrying a {@link ValidationError}.
 *
 * @example
 * ```ts
 * const result = safeJsonParse<{ id: string }>('{"id":"abc"}');
 * ```
 */
export function safeJsonParse<T = JsonValue>(text: string): Result<T, ValidationError> {
  try {
    return Result.ok(JSON.parse(text) as T);
  } catch (error) {
    return Result.fail(new ValidationError('Failed to parse JSON.', { cause: error }));
  }
}

/**
 * Serializes a value to a JSON string without throwing — failures (circular
 * references, non-serializable values such as `BigInt`) are returned as a
 * {@link Result} failure carrying an {@link InternalError}.
 *
 * @example
 * ```ts
 * const result = safeJsonStringify({ id: 'abc' });
 * ```
 */
export function safeJsonStringify(value: unknown, space?: number): Result<string, InternalError> {
  try {
    // `JSON.stringify`'s type signature always claims to return `string`,
    // but at runtime it returns `undefined` for values such as functions,
    // symbols, or a bare `undefined` — this cast restores that possibility.
    const json = JSON.stringify(value, null, space) as string | undefined;
    if (json === undefined) {
      return Result.fail(
        new InternalError('Value is not JSON-serializable.', { metadata: { type: typeof value } }),
      );
    }
    return Result.ok(json);
  } catch (error) {
    return Result.fail(new InternalError('Failed to stringify value to JSON.', { cause: error }));
  }
}
