import { describe, expect, it } from 'vitest';

describe('package entry point', () => {
  it('loads without throwing', async () => {
    await expect(import('../src/index.js')).resolves.toBeDefined();
  });
});
