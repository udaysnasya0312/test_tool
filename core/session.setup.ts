import { test as setup } from '@playwright/test';
import { loadAppConfig } from './config_loader.js';
import { loadTestData } from './data_setup.js';
import { signIn } from './login.js';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { reportDirectory } from './report_paths.js';
setup('load data and save authenticated session', async ({ page, context, browser, request }) => {
  const config = await loadAppConfig(process.env.TEST_APP!);
  await loadTestData(config);
  await mkdir(reportDirectory(config.name), { recursive: true });
  await signIn(config, request, context, browser);
  await page.goto(config.baseUrl);
  await context.storageState({ path: path.join(reportDirectory(config.name), 'storageState.json') });
});
