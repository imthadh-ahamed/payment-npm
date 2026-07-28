/**
 * Reusable, defensive validation helpers. Each guard throws a
 * {@link ValidationError} on failure rather than returning a boolean, so
 * invalid state can never silently propagate.
 */
import { UUID_PATTERN } from './constants.js';
import { ValidationError } from './errors.js';

function fail(message: string, fieldName: string): never {
  throw new ValidationError(message, { metadata: { field: fieldName } });
}

/**
 * The shape of {@link Guard}, declared explicitly (rather than inferred)
 * because TypeScript requires assertion-signature methods to be declared on
 * an explicitly-typed object for their `asserts` narrowing to apply at call
 * sites.
 */
interface GuardApi {
  /** Asserts `value` is neither `null` nor `undefined`. */
  notNull<T>(value: T | null | undefined, fieldName: string): asserts value is T;
  /** Asserts `value` is not `undefined`. */
  isDefined<T>(value: T | undefined, fieldName: string): asserts value is T;
  /** Asserts `value` (a string or array) has at least one element/character. */
  notEmpty(value: readonly unknown[] | string, fieldName: string): void;
  /** Asserts `value` contains at least one non-whitespace character. */
  notBlank(value: string, fieldName: string): void;
  /** Asserts `value` is strictly greater than zero. */
  isPositive(value: number, fieldName: string): void;
  /** Asserts `value` is a safe integer. */
  isInteger(value: number, fieldName: string): void;
  /** Asserts `value` is a syntactically valid UUID (versions 1-5). */
  isUUID(value: string, fieldName: string): void;
}

/**
 * A collection of small, composable precondition checks for use at the
 * boundaries of value objects, entities, and application use cases.
 *
 * @example
 * ```ts
 * class EmailAddress extends ValueObject<{ value: string }> {
 *   protected override validate(props: { value: string }): void {
 *     Guard.notBlank(props.value, 'value');
 *   }
 * }
 * ```
 */
export const Guard: GuardApi = {
  /** Asserts `value` is neither `null` nor `undefined`. */
  notNull<T>(value: T | null | undefined, fieldName: string): asserts value is T {
    if (value === null || value === undefined) {
      fail(`${fieldName} must not be null or undefined.`, fieldName);
    }
  },

  /** Asserts `value` is not `undefined`. */
  isDefined<T>(value: T | undefined, fieldName: string): asserts value is T {
    if (value === undefined) {
      fail(`${fieldName} must be defined.`, fieldName);
    }
  },

  /** Asserts `value` (a string or array) has at least one element/character. */
  notEmpty(value: readonly unknown[] | string, fieldName: string): void {
    if (value.length === 0) {
      fail(`${fieldName} must not be empty.`, fieldName);
    }
  },

  /** Asserts `value` contains at least one non-whitespace character. */
  notBlank(value: string, fieldName: string): void {
    if (value.trim().length === 0) {
      fail(`${fieldName} must not be blank.`, fieldName);
    }
  },

  /** Asserts `value` is strictly greater than zero. */
  isPositive(value: number, fieldName: string): void {
    if (!(value > 0)) {
      fail(`${fieldName} must be a positive number.`, fieldName);
    }
  },

  /** Asserts `value` is a safe integer. */
  isInteger(value: number, fieldName: string): void {
    if (!Number.isInteger(value)) {
      fail(`${fieldName} must be an integer.`, fieldName);
    }
  },

  /** Asserts `value` is a syntactically valid UUID (versions 1-5). */
  isUUID(value: string, fieldName: string): void {
    if (!UUID_PATTERN.test(value)) {
      fail(`${fieldName} must be a valid UUID.`, fieldName);
    }
  },
};
