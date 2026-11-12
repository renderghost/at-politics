import { defineConfig } from 'vitest/config';

// Unit tests live next to the code in src/. Browser tests in tests/e2e/ belong to Playwright,
// so Vitest must not collect them (its default pattern would match *.spec.ts).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
