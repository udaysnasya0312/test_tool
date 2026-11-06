import { healthCheck } from './health_check.js';
import { loadAppConfig } from './config_loader.js';
import type { FullConfig } from '@playwright/test';
export default async function globalSetup(_config: FullConfig): Promise<void> {
  const name = process.env.TEST_APP;
  if (!name) throw new Error('TEST_APP was not set by run_tests.mjs.');
  await healthCheck(await loadAppConfig(name));
}
