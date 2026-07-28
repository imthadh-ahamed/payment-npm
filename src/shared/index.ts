/**
 * Public API of the Shared Kernel: reusable primitives with no dependency
 * on any specific domain, framework, or infrastructure. This barrel is the
 * only file outside `src/shared` that other layers should import from —
 * internal helper modules are intentionally not re-exported here.
 */

export type {
  Brand,
  DeepReadonly,
  Dictionary,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  NonEmptyArray,
  Nullable,
  Optional,
  Primitive,
} from './types.js';

export { ERROR_CODES, UUID_PATTERN } from './constants.js';
export type { ErrorCode } from './constants.js';

export { Failure, Result, ResultUnwrapError, Success } from './result.js';

export {
  BaseError,
  ConfigurationError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';
export type { ErrorOptions, SerializedError } from './errors.js';

export { MockClock, SystemClock } from './clock.js';
export type { Clock } from './clock.js';

export { CryptoUuidGenerator, MockUuidGenerator } from './uuid.js';
export type { UuidGenerator } from './uuid.js';

export { Identifier } from './identifier.js';
export { ValueObject } from './value-object.js';
export { Entity } from './entity.js';
export { AggregateRoot } from './aggregate-root.js';
export { DomainEvent } from './domain-event.js';
export type { DomainEventProps } from './domain-event.js';

export { Guard } from './guard.js';

export { deepFreeze, objectEquals, safeJsonParse, safeJsonStringify } from './utils.js';
