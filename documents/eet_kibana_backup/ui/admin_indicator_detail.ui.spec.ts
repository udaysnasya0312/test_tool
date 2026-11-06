import { test } from '../../../core/fixtures.js';
import { AdminIndicatorDetailPage } from '../pages/admin_indicator_detail.page.js';
test.describe('Admin indicator detail', () => {
  test('indicator 20 opens cleanly', async ({ page }) => {
    const screen = new AdminIndicatorDetailPage(page);
    await screen.open();
    await screen.expectClean();
  });
});
