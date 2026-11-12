import { defineConfig, devices } from '@playwright/test';

// Not 4321: that is `astro dev`'s default. A dedicated port means the tests can only ever reach
// the production build they start themselves, never a running dev server.
const PORT = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // Tests run against the production build, served statically.
  webServer: {
    // --ignore-lock: Astro refuses to start a second preview while another (e.g. a background
    // `astro preview --background`) holds the project's lock file; the tests need their own.
    command: `npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
