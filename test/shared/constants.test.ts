import { describe, expect, it } from 'vitest';

import { ERROR_CODES, UUID_PATTERN } from '../../src/shared/constants.js';

describe('ERROR_CODES', () => {
  it('contains no duplicate values', () => {
    const values = Object.values(ERROR_CODES);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('UUID_PATTERN', () => {
  it('matches valid UUIDs (versions 1-5)', () => {
    expect(UUID_PATTERN.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(UUID_PATTERN.test('11111111-1111-4111-8111-111111111111')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(UUID_PATTERN.test('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    expect(UUID_PATTERN.test('not-a-uuid')).toBe(false);
    expect(UUID_PATTERN.test('')).toBe(false);
  });

  it('rejects a UUID with an invalid version nibble', () => {
    expect(UUID_PATTERN.test('123e4567-e89b-62d3-a456-426614174000')).toBe(false);
  });
});
