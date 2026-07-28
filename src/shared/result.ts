/**
 * A production-grade `Result<T, E>` type for representing the outcome of an
 * operation that can fail in an expected way, without resorting to
 * exceptions for control flow. Exceptions remain reserved for truly
 * unexpected/programmer-error conditions.
 */

/** Thrown by {@link Success.unwrap}/{@link Failure.unwrap} when called on a {@link Failure}. */
export class ResultUnwrapError extends Error {
  constructor(readonly failureValue: unknown) {
    super('Called unwrap() on a Failure result.');
    this.name = 'ResultUnwrapError';
  }
}

interface ResultMethods<T, E> {
  readonly kind: 'success' | 'failure';

  /** Narrows this result to {@link Success}. */
  isSuccess(): this is Success<T, E>;

  /** Narrows this result to {@link Failure}. */
  isFailure(): this is Failure<T, E>;

  /** Transforms the success value, passing failures through unchanged. */
  map<TNext>(onSuccess: (value: T) => TNext): Result<TNext, E>;

  /** Chains another `Result`-returning operation, short-circuiting on failure. */
  flatMap<TNext>(onSuccess: (value: T) => Result<TNext, E>): Result<TNext, E>;

  /** Collapses the result to a single value by handling both branches. */
  fold<TOut>(onSuccess: (value: T) => TOut, onFailure: (error: E) => TOut): TOut;

  /**
   * Returns the success value, or throws {@link ResultUnwrapError} if this is
   * a failure. Prefer {@link ResultMethods.unwrapOr}, {@link ResultMethods.unwrapOrElse},
   * or {@link ResultMethods.fold} in production code paths.
   */
  unwrap(): T;

  /** Returns the success value, or `fallback` if this is a failure. */
  unwrapOr(fallback: T): T;

  /** Returns the success value, or the result of `onFailure` if this is a failure. */
  unwrapOrElse(onFailure: (error: E) => T): T;
}

/**
 * The successful outcome of a {@link Result}-returning operation.
 *
 * @example
 * ```ts
 * const result = Result.ok<number, string>(42);
 * if (result.isSuccess()) {
 *   console.log(result.value); // 42
 * }
 * ```
 */
export class Success<T, E> implements ResultMethods<T, E> {
  readonly kind = 'success' as const;

  constructor(readonly value: T) {}

  isSuccess(): this is Success<T, E> {
    return true;
  }

  isFailure(): this is Failure<T, E> {
    return false;
  }

  map<TNext>(onSuccess: (value: T) => TNext): Result<TNext, E> {
    return new Success(onSuccess(this.value));
  }

  flatMap<TNext>(onSuccess: (value: T) => Result<TNext, E>): Result<TNext, E> {
    return onSuccess(this.value);
  }

  fold<TOut>(onSuccess: (value: T) => TOut, _onFailure: (error: E) => TOut): TOut {
    return onSuccess(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_fallback: T): T {
    return this.value;
  }

  unwrapOrElse(_onFailure: (error: E) => T): T {
    return this.value;
  }
}

/**
 * The failed outcome of a {@link Result}-returning operation.
 *
 * @example
 * ```ts
 * const result = Result.fail<never, string>('not found');
 * const message = result.unwrapOr('default');
 * ```
 */
export class Failure<T, E> implements ResultMethods<T, E> {
  readonly kind = 'failure' as const;

  constructor(readonly error: E) {}

  isSuccess(): this is Success<T, E> {
    return false;
  }

  isFailure(): this is Failure<T, E> {
    return true;
  }

  map<TNext>(_onSuccess: (value: T) => TNext): Result<TNext, E> {
    return new Failure(this.error);
  }

  flatMap<TNext>(_onSuccess: (value: T) => Result<TNext, E>): Result<TNext, E> {
    return new Failure(this.error);
  }

  fold<TOut>(_onSuccess: (value: T) => TOut, onFailure: (error: E) => TOut): TOut {
    return onFailure(this.error);
  }

  unwrap(): never {
    throw new ResultUnwrapError(this.error);
  }

  unwrapOr(fallback: T): T {
    return fallback;
  }

  unwrapOrElse(onFailure: (error: E) => T): T {
    return onFailure(this.error);
  }
}

/** The outcome of an operation that either succeeded with a `T` or failed with an `E`. */
export type Result<T, E> = Failure<T, E> | Success<T, E>;

/**
 * Factory functions for constructing {@link Result} values.
 *
 * @example
 * ```ts
 * function parsePort(input: string): Result<number, string> {
 *   const port = Number(input);
 *   return Number.isInteger(port) && port > 0
 *     ? Result.ok(port)
 *     : Result.fail(`"${input}" is not a valid port.`);
 * }
 * ```
 */
export const Result = {
  /** Wraps `value` in a {@link Success}. */
  ok<T, E = never>(value: T): Result<T, E> {
    return new Success(value);
  },

  /** Wraps `error` in a {@link Failure}. */
  fail<E, T = never>(error: E): Result<T, E> {
    return new Failure(error);
  },
} as const;
