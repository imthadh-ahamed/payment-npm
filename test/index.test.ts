import { describe, expect, it } from 'vitest';

describe('package entry point', () => {
  it('re-exports the Shared Kernel public API', async () => {
    const pkg = await import('../src/index.js');
    expect(pkg.Result).toBeDefined();
    expect(pkg.BaseError).toBeDefined();
    expect(pkg.Identifier).toBeDefined();
    expect(pkg.Entity).toBeDefined();
    expect(pkg.ValueObject).toBeDefined();
    expect(pkg.AggregateRoot).toBeDefined();
    expect(pkg.Guard).toBeDefined();
  });
});
