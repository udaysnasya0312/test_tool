import type { AppConfig } from './types.js';
// Waits for the app to answer 2xx, retrying for up to HEALTH_WAIT_SECONDS (default 30) in case it is still starting.
export async function healthCheck(config: AppConfig): Promise<void> {
  const url = config.healthCheckUrl || config.baseUrl;
  const deadline = Date.now() + Number(process.env.HEALTH_WAIT_SECONDS ?? 30) * 1000;
  let last = '';
  do {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (response.ok) return;
      last = `HTTP ${response.status} ${response.statusText}`;
    } catch (error) { last = error instanceof Error ? error.message : String(error); }
    await new Promise(r => setTimeout(r, 2000));
  } while (Date.now() < deadline);
  throw new Error(`Health check failed for ${url}: ${last}`);
}
