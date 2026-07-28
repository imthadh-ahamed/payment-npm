import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/shared/**/*.ts'],
      // `index.ts` is a re-export barrel; `types.ts` is type-only and
      // produces no runtime code — neither is meaningfully coverable.
      exclude: ['src/shared/index.ts', 'src/shared/types.ts'],
    },
  },
});
