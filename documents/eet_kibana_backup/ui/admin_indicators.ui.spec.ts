import { test } from '../../../core/fixtures.js';
import { AdminIndicatorsPage } from '../pages/admin_indicators.page.js';
test.describe('Admin indicator list', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new AdminIndicatorsPage(page);
    await screen.open();
    await screen.expectClean();
  });
});
