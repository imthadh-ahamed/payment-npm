import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/shared/**/*.ts', 'src/domain/**/*.ts'],
      // `index.ts` barrels are re-exports only; `types.ts` is type-only and
      // produces no runtime code — none of these are meaningfully coverable.
      exclude: ['src/shared/index.ts', 'src/shared/types.ts', 'src/domain/index.ts'],
    },
  },
});
