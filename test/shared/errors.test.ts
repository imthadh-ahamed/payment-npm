import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../src/shared/constants.js';
import {
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
} from '../../src/shared/errors.js';

describe('error hierarchy', () => {
  const subclasses = [
    { Ctor: ValidationError, code: ERROR_CODES.VALIDATION },
    { Ctor: ConfigurationError, code: ERROR_CODES.CONFIGURATION },
    { Ctor: InternalError, code: ERROR_CODES.INTERNAL },
    { Ctor: TimeoutError, code: ERROR_CODES.TIMEOUT },
    { Ctor: ConflictError, code: ERROR_CODES.CONFLICT },
    { Ctor: UnauthorizedError, code: ERROR_CODES.UNAUTHORIZED },
    { Ctor: ForbiddenError, code: ERROR_CODES.FORBIDDEN },
    { Ctor: NotFoundError, code: ERROR_CODES.NOT_FOUND },
    { Ctor: ExternalServiceError, code: ERROR_CODES.EXTERNAL_SERVICE },
  ] as const;

  it.each(subclasses)(
    '$Ctor.name extends BaseError and Error with the correct code',
    ({ Ctor, code }) => {
      const error = new Ctor('something went wrong');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(Ctor);
      expect(error.code).toBe(code);
      expect(error.name).toBe(Ctor.name);
      expect(error.message).toBe('something went wrong');
    },
  );

  it('defaults metadata to an empty object', () => {
    const error = new ValidationError('bad input');
    expect(error.metadata).toEqual({});
  });

  it('stores provided metadata', () => {
    const error = new ValidationError('bad input', { metadata: { field: 'email' } });
    expect(error.metadata).toEqual({ field: 'email' });
  });

  it('stores a provided cause', () => {
    const cause = new Error('root cause');
    const error = new InternalError('wrapped failure', { cause });
    expect(error.cause).toBe(cause);
  });

  it('exposes a stack trace', () => {
    const error = new NotFoundError('missing');
    expect(typeof error.stack).toBe('string');
  });

  describe('toJSON', () => {
    it('serializes name, code, message, metadata, and stack', () => {
      const error = new ConflictError('duplicate', { metadata: { id: '123' } });
      const json = error.toJSON();
      expect(json).toMatchObject({
        name: 'ConflictError',
        code: ERROR_CODES.CONFLICT,
        message: 'duplicate',
        metadata: { id: '123' },
      });
      expect(typeof json.stack).toBe('string');
    });

    it('serializes an undefined cause as undefined', () => {
      const error = new ValidationError('bad input');
      expect(error.toJSON().cause).toBeUndefined();
    });

    it('recursively serializes a BaseError cause', () => {
      const cause = new NotFoundError('missing resource');
      const error = new InternalError('wrapped', { cause });
      const json = error.toJSON();
      expect(json.cause).toMatchObject({ name: 'NotFoundError', code: ERROR_CODES.NOT_FOUND });
    });

    it('serializes a plain Error cause to name/message/stack', () => {
      const cause = new Error('native failure');
      const error = new InternalError('wrapped', { cause });
      const json = error.toJSON();
      expect(json.cause).toMatchObject({ name: 'Error', message: 'native failure' });
    });

    it('serializes a JSON-safe primitive cause as-is', () => {
      const error = new InternalError('wrapped', { cause: 'plain string cause' });
      expect(error.toJSON().cause).toBe('plain string cause');
    });

    it('serializes a JSON-safe object cause as-is', () => {
      const error = new InternalError('wrapped', { cause: { reason: 'disk full' } });
      expect(error.toJSON().cause).toEqual({ reason: 'disk full' });
    });

    it('serializes a null cause as-is', () => {
      const error = new InternalError('wrapped', { cause: null });
      expect(error.toJSON().cause).toBeNull();
    });

    it('serializes a JSON-safe array cause as-is', () => {
      const error = new InternalError('wrapped', { cause: [1, 'two', { three: 3 }] });
      expect(error.toJSON().cause).toEqual([1, 'two', { three: 3 }]);
    });

    it('falls back to String() for a non-JSON-safe cause', () => {
      const causeFunction = (): undefined => undefined;
      const error = new InternalError('wrapped', { cause: causeFunction });
      expect(error.toJSON().cause).toBe(String(causeFunction));
    });

    it('produces a JSON.stringify-safe result', () => {
      const error = new ValidationError('bad input', { metadata: { field: 'email' } });
      expect(() => JSON.stringify(error)).not.toThrow();
    });
  });
});
