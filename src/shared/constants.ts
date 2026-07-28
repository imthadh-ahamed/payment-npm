/**
 * Package-wide constants for the Shared Kernel. Centralized here so error
 * codes and validation patterns are never duplicated as magic strings.
 */

/**
 * Canonical error codes produced by the {@link BaseError} hierarchy.
 *
 * @example
 * ```ts
 * if (error.code === ERROR_CODES.NOT_FOUND) {
 *   // handle a not-found condition
 * }
 * ```
 */
export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  CONFIGURATION: 'CONFIGURATION_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED_ERROR',
  FORBIDDEN: 'FORBIDDEN_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE_ERROR',
} as const;

/** Union of every error code produced by the built-in {@link BaseError} hierarchy. */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Matches a canonical (RFC 4122) UUID, versions 1-5, case-insensitively.
 *
 * @example
 * ```ts
 * UUID_PATTERN.test('123e4567-e89b-12d3-a456-426614174000'); // true
 * ```
 */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
