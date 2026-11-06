import { test } from '@playwright/test';
import { runApiEntry } from '../../../core/api_runner.js';
import { loadAppConfig } from '../../../core/config_loader.js';
import { analyticsRoutes } from './analytics.api.js';
for (const entry of analyticsRoutes) test('API: ' + entry.name, async ({ request }) => {
  const config = await loadAppConfig(process.env.TEST_APP!);
  await runApiEntry(entry, config, request);
});
