import { test, expect } from '../../../core/fixtures.js';
import { HelpCenterPage } from '../pages/help_center.page.js';
test.describe('Help center', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new HelpCenterPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
