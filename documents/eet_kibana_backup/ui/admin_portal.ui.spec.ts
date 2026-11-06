import { test, expect } from '../../../core/fixtures.js';
import { AdminPortalPage } from '../pages/admin_portal.page.js';
test.describe('Admin portal', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new AdminPortalPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
