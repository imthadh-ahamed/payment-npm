import { describe, expect, it, vi } from 'vitest';

import { Failure, Result, ResultUnwrapError, Success } from '../../src/shared/result.js';

describe('Result', () => {
  describe('Result.ok', () => {
    it('creates a Success instance', () => {
      const result = Result.ok(42);
      expect(result).toBeInstanceOf(Success);
      expect(result.kind).toBe('success');
    });

    it('reports isSuccess() true and isFailure() false', () => {
      const result = Result.ok(42);
      expect(result.isSuccess()).toBe(true);
      expect(result.isFailure()).toBe(false);
    });
  });

  describe('Result.fail', () => {
    it('creates a Failure instance', () => {
      const result = Result.fail('boom');
      expect(result).toBeInstanceOf(Failure);
      expect(result.kind).toBe('failure');
    });

    it('reports isSuccess() false and isFailure() true', () => {
      const result = Result.fail('boom');
      expect(result.isSuccess()).toBe(false);
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('map', () => {
    it('transforms the value of a Success', () => {
      const result = Result.ok<number, string>(2).map((value) => value * 2);
      expect(result.unwrap()).toBe(4);
    });

    it('passes a Failure through unchanged', () => {
      const result = Result.fail<string, number>('boom').map((value) => value * 2);
      expect(result.isFailure()).toBe(true);
      expect(
        result.fold(
          () => 'unexpected success',
          (error) => error,
        ),
      ).toBe('boom');
    });
  });

  describe('flatMap', () => {
    it('chains a Success into another Result', () => {
      const result = Result.ok<number, string>(2).flatMap((value) => Result.ok(value + 1));
      expect(result.unwrap()).toBe(3);
    });

    it('short-circuits on Failure without invoking the callback', () => {
      const onSuccess = vi.fn((value: number) => Result.ok<number, string>(value + 1));
      const result = Result.fail<string, number>('boom').flatMap((value) => onSuccess(value));
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.isFailure()).toBe(true);
    });

    it('propagates a failure returned by the chained callback', () => {
      const result = Result.ok<number, string>(2).flatMap(() =>
        Result.fail<string, number>('nested failure'),
      );
      expect(result.isFailure()).toBe(true);
      expect(result.unwrapOr(-1)).toBe(-1);
    });
  });

  describe('fold', () => {
    it('invokes onSuccess for a Success', () => {
      const value = Result.ok<number, string>(10).fold(
        (v) => v * 10,
        () => -1,
      );
      expect(value).toBe(100);
    });

    it('invokes onFailure for a Failure', () => {
      const value = Result.fail<string, number>('boom').fold(
        () => -1,
        (error) => error.length,
      );
      expect(value).toBe(4);
    });
  });

  describe('unwrap', () => {
    it('returns the value for a Success', () => {
      expect(Result.ok(5).unwrap()).toBe(5);
    });

    it('throws ResultUnwrapError for a Failure', () => {
      const result = Result.fail<string, number>('boom');
      expect(() => result.unwrap()).toThrow(ResultUnwrapError);
    });

    it('exposes the failure value on the thrown error', () => {
      const result = Result.fail<string, number>('boom');
      try {
        result.unwrap();
        expect.unreachable('unwrap() should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ResultUnwrapError);
        expect((error as ResultUnwrapError).failureValue).toBe('boom');
      }
    });
  });

  describe('unwrapOr', () => {
    it('returns the value for a Success, ignoring the fallback', () => {
      expect(Result.ok(5).unwrapOr(-1)).toBe(5);
    });

    it('returns the fallback for a Failure', () => {
      expect(Result.fail<string, number>('boom').unwrapOr(-1)).toBe(-1);
    });
  });

  describe('unwrapOrElse', () => {
    it('returns the value for a Success without invoking the callback', () => {
      const onFailure = vi.fn(() => -1);
      expect(Result.ok<number, string>(5).unwrapOrElse(onFailure)).toBe(5);
      expect(onFailure).not.toHaveBeenCalled();
    });

    it('invokes the callback with the error for a Failure', () => {
      const result = Result.fail<string, number>('boom').unwrapOrElse((error) => error.length);
      expect(result).toBe(4);
    });
  });
});
