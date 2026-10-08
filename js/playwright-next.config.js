import { defineConfig } from '@playwright/test';
process.env.NEXT_TELEMETRY_DISABLED = '1';
export default defineConfig({
  testDir: './tests/next-browser',
  testMatch: '**/*.pw.js',
  timeout: 30000,
  workers: 1,
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: process.env.LINO_NEXT_PRODUCTION
      ? 'node node_modules/next/dist/bin/next start examples/next-usage --hostname 127.0.0.1 --port 4174'
      : 'node node_modules/next/dist/bin/next dev examples/next-usage --webpack --hostname 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/en',
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});
