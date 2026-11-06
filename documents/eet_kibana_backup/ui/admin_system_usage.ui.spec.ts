import { test, expect } from '../../../core/fixtures.js';
import { AdminSystemUsagePage } from '../pages/admin_system_usage.page.js';
test.describe('Admin system usage', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new AdminSystemUsagePage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
