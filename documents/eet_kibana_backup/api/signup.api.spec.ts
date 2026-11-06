import { test } from '@playwright/test';
import { runApiEntry } from '../../../core/api_runner.js';
import { loadAppConfig } from '../../../core/config_loader.js';
import { signupRoutes } from './signup.api.js';
for (const entry of signupRoutes) test('API: ' + entry.name, async ({ request }) => {
  const config = await loadAppConfig(process.env.TEST_APP!);
  await runApiEntry(entry, config, request);
});
