import { test as teardown } from '@playwright/test';
import { loadAppConfig } from './config_loader.js';
import { cleanupTestData } from './data_setup.js';
teardown('clean up test data', async () => { await cleanupTestData(await loadAppConfig(process.env.TEST_APP!)); });
