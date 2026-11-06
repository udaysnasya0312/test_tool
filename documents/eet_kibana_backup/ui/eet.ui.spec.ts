import { test } from '../../../core/fixtures.js';
import { EetPage } from '../pages/eet.page.js';
test.describe('Main dashboard', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new EetPage(page);
    await screen.open('/eet');
    await screen.expectClean();
  });
  test('correlation mode opens cleanly', async ({ page }) => {
    const screen = new EetPage(page);
    await screen.open('/corelate');
    await screen.expectClean();
  });
});
