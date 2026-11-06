import { test as base, expect } from '@playwright/test';
// UI specs import { test, expect } from here instead of '@playwright/test'.
// In the visible-browser mode (test:headed) every test ends by letting the screen finish loading and keeping it
// on screen for HOLD_SCREEN_MS (default 3000), so a tester can see what loaded. Hidden runs don't wait.
export const test = base.extend<{ holdScreen: void }>({
  holdScreen: [async ({ page }, use) => {
    await use();
    if (process.env.TEST_HEADED !== '1' || page.isClosed()) return;
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
    await page.waitForTimeout(Number(process.env.HOLD_SCREEN_MS ?? 3000));
  }, { auto: true }]
});
export { expect };
