import { test } from '@playwright/test';
import { runApiEntry } from '../../../core/api_runner.js';
import { loadAppConfig } from '../../../core/config_loader.js';
import { loginRoutes } from './login.api.js';
for (const entry of loginRoutes) test('API: ' + entry.name, async ({ request }) => {
  const config = await loadAppConfig(process.env.TEST_APP!);
  await runApiEntry(entry, config, request);
});
