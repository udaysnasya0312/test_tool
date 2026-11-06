import { test, expect } from '../../../core/fixtures.js';
import { UserManagementPage } from '../pages/user_management.page.js';
test.describe('User management', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new UserManagementPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
