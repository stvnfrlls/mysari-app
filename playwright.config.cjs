const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.playwright') }); // add this line

module.exports = defineConfig({
    testDir: './tests/e2e',
    globalSetup: require.resolve('./tests/global-setup.js'),
    fullyParallel: false,
    workers: Number(process.env.PW_WORKERS || 1),
    retries: process.env.CI ? 2 : 0,
    use: {
        baseURL: 'http://localhost:8000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
