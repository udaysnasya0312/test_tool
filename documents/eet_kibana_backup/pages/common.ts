import { expect } from '@playwright/test';
import type { Page, Response } from '@playwright/test';
import { LoginPage } from './login.page.js';
// Shared by every <screen>.page.ts: sign in, open a screen, and catch errors on it.
const appPath = '/app/eetUi';
// Kibana's own background calls are not EET's, so their failures are ignored.
const kibanaPaths = ['/internal/', '/translations/', '/api/status', '/api/licensing', '/api/features', '/api/saved_objects', '/api/telemetry', '/api/core'];
export class ScreenPage {
  // EET API calls (same server) that answered with HTTP 400 or higher while the page was open.
  readonly failedApiCalls: string[] = [];
  constructor(protected readonly page: Page) {
    page.on('response', this.recordFailure);
  }
  private recordFailure = (response: Response) => {
    const request = response.request();
    if (!['fetch', 'xhr'].includes(request.resourceType()) || response.status() < 400) return;
    const url = new URL(response.url());
    if (url.host !== new URL(this.page.url()).host || kibanaPaths.some((path) => url.pathname.startsWith(path))) return;
    this.failedApiCalls.push(`${response.status()} ${request.method()} ${url.pathname}`);
  };
  // Kibana shows addDanger/addError toasts with the "error" icon.
  errorToasts = () => this.page.locator('[data-test-subj="globalToastList"] [data-icon-type="error"]');
  // The app's catch-all route renders only this text.
  notFound = () => this.page.getByText('NotFoundPage', { exact: true });
  heading = (name: string) => this.page.getByRole('heading', { name, exact: true });
  openPath = async (path: string) => {
    await this.page.goto(appPath + path);
    // Charts load in several calls; wait for them, but don't fail if Kibana keeps a request open.
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  };
  signIn = async (username: string, password: string) => {
    const loginPage = new LoginPage(this.page);
    await loginPage.open();
    await loginPage.signIn(username, password);
    await this.page.waitForURL(/\/app\/eetUi\/?$/);
  };
  // The screen rendered, showed no error toast, and none of its API calls failed.
  expectClean = async () => {
    await expect(this.notFound()).toHaveCount(0);
    await expect(this.errorToasts()).toHaveCount(0);
    expect(this.failedApiCalls).toEqual([]);
  };
}
