import type { AppConfig } from './types.js';
export async function loadTestData(config: AppConfig): Promise<void> { await config.data?.load(); }
export async function cleanupTestData(config: AppConfig): Promise<void> { await config.data?.cleanup(); }
