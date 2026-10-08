import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/tanstack-browser',
  testMatch: '**/*.pw.js',
  timeout: 30000,
  workers: 1,
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: process.env.LINO_TANSTACK_PRODUCTION
      ? 'node node_modules/srvx/bin/srvx.mjs serve --prod --entry examples/tanstack-usage/dist/server/server.js --static ../client --host 127.0.0.1 --port 4175'
      : 'node node_modules/vite/bin/vite.js --config examples/tanstack-usage/vite.config.js',
    url: 'http://127.0.0.1:4175/en',
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});
