const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', headless: true, acceptDownloads: true },
  webServer: { command: 'node tests/browser/qrTestServer.js', url: 'http://127.0.0.1:4173/qr', reuseExistingServer: false, timeout: 15000 },
  reporter: [['list']]
});
