import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { loadAppConfig } from './core/config_loader.js';
import { reportDirectory } from './core/report_paths.js';
const app = await loadAppConfig(process.env.TEST_APP!);
const appDir = path.resolve('apps', app.name);
const reportDir = reportDirectory(app.name);
const enabled = process.env.TEST_MODE!;
const consumers: any[] = [
  { name: enabled, testDir: path.join(appDir, enabled), testMatch: /\.spec\.ts$/, dependencies: ['setup'],
    ...(enabled !== 'api' ? { use: { storageState: path.join(reportDir, 'storageState.json') } } : {}) }
];
const projects: any[] = [
  { name: 'setup', testMatch: /session\.setup\.ts/, teardown: 'teardown' },
  ...consumers,
  { name: 'teardown', testMatch: /session\.teardown\.ts/ }
];
export default defineConfig({
  testDir: path.resolve('core'), testMatch: /session\.(setup|teardown)\.ts/,
  globalSetup: './core/global_setup.ts', globalTeardown: './core/global_teardown.ts',
  projects, fullyParallel: false, workers: 1, timeout: app.timeouts?.test ?? 30000,
  expect: { timeout: app.timeouts?.expect ?? 5000 },
  use: { baseURL: app.baseUrl, actionTimeout: app.timeouts?.action ?? 10000, browserName: 'chromium', headless: process.env.TEST_HEADED !== '1', launchOptions: { slowMo: process.env.TEST_HEADED === '1' ? Number(process.env.SLOW_MO ?? 500) : 0 },screenshot: process.env.SCREENSHOTS === 'failures' ? 'only-on-failure' : 'on', video: process.env.VIDEOS === 'failures' ? 'retain-on-failure' : 'on', trace: 'retain-on-failure' },
  outputDir: path.join(reportDir, 'artifacts'), reporter: [['list'], ['html', { outputFolder: path.join(reportDir, 'html'), open: 'never' }], ['./core/reporting.ts'], ['allure-playwright', { resultsDir: path.join(reportDir, 'allure-results'), detail: true, environmentInfo: { App: app.name, Frontend: app.baseUrl, API: app.apiBaseUrl } }]]
});
