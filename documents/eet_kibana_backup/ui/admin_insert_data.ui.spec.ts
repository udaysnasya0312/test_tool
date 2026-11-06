import { test, expect } from '../../../core/fixtures.js';
import { AdminInsertDataPage } from '../pages/admin_insert_data.page.js';
test.describe('Admin insert data', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new AdminInsertDataPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
