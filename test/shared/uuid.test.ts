import { describe, expect, it } from 'vitest';

import { UUID_PATTERN } from '../../src/shared/constants.js';
import { CryptoUuidGenerator, MockUuidGenerator } from '../../src/shared/uuid.js';

describe('CryptoUuidGenerator', () => {
  it('generates syntactically valid, unique UUIDs', () => {
    const generator = new CryptoUuidGenerator();
    const a = generator.generate();
    const b = generator.generate();
    expect(a).toMatch(UUID_PATTERN);
    expect(b).toMatch(UUID_PATTERN);
    expect(a).not.toBe(b);
  });
});

describe('MockUuidGenerator', () => {
  it('produces a deterministic, UUID-shaped sequence with no fixed values', () => {
    const generator = new MockUuidGenerator();
    const first = generator.generate();
    const second = generator.generate();
    expect(first).toMatch(UUID_PATTERN);
    expect(second).toMatch(UUID_PATTERN);
    expect(first).not.toBe(second);
  });

  it('cycles through fixed values in order', () => {
    const generator = new MockUuidGenerator([
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ]);
    expect(generator.generate()).toBe('11111111-1111-4111-8111-111111111111');
    expect(generator.generate()).toBe('22222222-2222-4222-8222-222222222222');
    expect(generator.generate()).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('reset() restarts the sequence from the beginning', () => {
    const generator = new MockUuidGenerator(['11111111-1111-4111-8111-111111111111']);
    generator.generate();
    generator.generate();
    generator.reset();
    expect(generator.generate()).toBe('11111111-1111-4111-8111-111111111111');
  });
});
