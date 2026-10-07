import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.pw.js',
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    browserName: 'chromium',
    locale: 'ru-RU',
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node examples/browser-usage/server.mjs',
    url: 'http://127.0.0.1:4173/examples/browser-usage/',
    timeout: 30000,
    reuseExistingServer: !process.env.CI,
  },
});
