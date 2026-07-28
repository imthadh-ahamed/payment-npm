/**
 * A reusable, structured error hierarchy. Every error carries a stable
 * `code`, an optional `cause`, and structured `metadata`, and serializes
 * cleanly via {@link BaseError.toJSON} — safe to pass to a logger or an API
 * error response without leaking non-JSON-safe internals.
 */
import { ERROR_CODES } from './constants.js';
import type { Dictionary, JsonObject, JsonValue } from './types.js';

/** Options accepted by every {@link BaseError} subclass constructor. */
export interface ErrorOptions {
  /** The underlying error or value that caused this error, if any. */
  readonly cause?: unknown;
  /** Structured, JSON-serializable context about the failure. */
  readonly metadata?: Readonly<Dictionary>;
}

/** The plain-object shape produced by {@link BaseError.toJSON}. */
export interface SerializedError {
  readonly name: string;
  readonly code: string;
  readonly message: string;
  readonly metadata: Readonly<Dictionary>;
  readonly stack: string | undefined;
  readonly cause: JsonValue | undefined;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }
  if (type === 'object') {
    return Object.values(value as Dictionary).every((item) => isJsonValue(item));
  }
  return false;
}

function serializeCause(cause: unknown): JsonValue | undefined {
  if (cause === undefined) {
    return undefined;
  }
  if (cause instanceof BaseError) {
    // `SerializedError` is structurally JSON-safe but lacks an index
    // signature, so it isn't directly assignable to `JsonObject`.
    return cause.toJSON() as unknown as JsonObject;
  }
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message, stack: cause.stack ?? null };
  }
  if (isJsonValue(cause)) {
    return cause;
  }
  // Last-resort, deliberately lossy fallback for exotic cause values
  // (functions, symbols, class instances without a custom `toString`).
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(cause);
}

/**
 * The abstract base of every error in this hierarchy. Application code
 * should not throw `BaseError` directly — use one of its subclasses (or
 * define a new one) so callers can discriminate on `code` or type.
 *
 * @example
 * ```ts
 * class OutOfStockError extends BaseError {
 *   constructor(sku: string) {
 *     super(`Item ${sku} is out of stock.`, 'OUT_OF_STOCK', { metadata: { sku } });
 *   }
 * }
 * ```
 */
export abstract class BaseError extends Error {
  /** A stable, machine-readable identifier for this error condition. */
  readonly code: string;
  /** Structured context about the failure, safe to log. */
  readonly metadata: Readonly<Dictionary>;

  protected constructor(message: string, code: string, options: ErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;
    this.code = code;
    this.metadata = options.metadata ?? {};
  }

  /**
   * Produces a plain, JSON-safe representation of this error — suitable for
   * structured logging or inclusion in an API error response.
   */
  toJSON(): SerializedError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      stack: this.stack,
      cause: serializeCause(this.cause),
    };
  }
}

/** The input to an operation failed validation (malformed, missing, or out-of-range data). */
export class ValidationError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.VALIDATION, options);
  }
}

/** The running configuration is missing, malformed, or internally inconsistent. */
export class ConfigurationError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.CONFIGURATION, options);
  }
}

/** An unexpected internal failure occurred that does not fit a more specific category. */
export class InternalError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.INTERNAL, options);
  }
}

/** An operation did not complete within its allotted time budget. */
export class TimeoutError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.TIMEOUT, options);
  }
}

/** The requested change conflicts with the current state of the resource. */
export class ConflictError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.CONFLICT, options);
  }
}

/** The caller could not be authenticated. */
export class UnauthorizedError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.UNAUTHORIZED, options);
  }
}

/** The caller was authenticated but is not permitted to perform this operation. */
export class ForbiddenError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.FORBIDDEN, options);
  }
}

/** The requested resource does not exist. */
export class NotFoundError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.NOT_FOUND, options);
  }
}

/** A call to an external, out-of-process service failed. */
export class ExternalServiceError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, ERROR_CODES.EXTERNAL_SERVICE, options);
  }
}
