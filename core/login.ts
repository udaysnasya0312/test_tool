import type { APIRequestContext, Browser, BrowserContext, Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from './types.js';
import { reportDirectory } from './report_paths.js';
export const authHeadersPath = (app: string) => path.join(reportDirectory(app), 'auth_headers.json');
export async function signIn(config: AppConfig, request: APIRequestContext, context: BrowserContext, browser: Browser): Promise<void> {
  if (config.auth.method === 'none') return;
  if (config.auth.method === 'token') {
    const auth = config.auth;
    const response = await request.post(new URL(auth.loginPath, config.apiBaseUrl).href, { data: auth.payload?.(auth.username, auth.password) ?? { username: auth.username, password: auth.password } });
    if (!response.ok()) throw new Error(`Token login failed: HTTP ${response.status()} ${await response.text()}`);
    const body = await response.json();
    const token = auth.tokenPath.split('.').reduce((v: any, k) => v?.[k], body);
    if (!token) throw new Error(`Token login response did not contain ${auth.tokenPath}`);
    const headers = { [auth.headerName ?? 'Authorization']: `${auth.prefix ?? ''}${token}` };
    // API rows read this file and send the header (see api_runner.ts).
    await mkdir(reportDirectory(config.name), { recursive: true });
    await writeFile(authHeadersPath(config.name), JSON.stringify(headers));
    await context.setExtraHTTPHeaders(headers);
    if (auth.browserStorage) {
      const picked = auth.browserStorage.value ? auth.browserStorage.value.split('.').reduce((v: any, k) => v?.[k], body) : body;
      const value = typeof picked === 'string' ? picked : JSON.stringify(picked);
      await context.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: auth.browserStorage.key, value });
    }
    return;
  }
  const auth = config.auth;
  const page: Page = await context.newPage();
  await page.goto(new URL(auth.loginPath, config.baseUrl).href);
  await page.locator(auth.usernameSelector).fill(auth.username);
  await page.locator(auth.passwordSelector).fill(auth.password);
  await page.locator(auth.submitSelector).click();
  // Wait until the app leaves the login screen, so the saved session really is logged in.
  const loginPathname = new URL(auth.loginPath, config.baseUrl).pathname;
  await page.waitForURL(url => !url.pathname.startsWith(loginPathname), { timeout: 20000 })
    .catch(() => { throw new Error(`Form login did not leave ${auth.loginPath}: check the username, password and selectors`); });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
  await page.close();
  // Keep the parameter explicit: the browser is already represented by this context.
  void browser;
}
