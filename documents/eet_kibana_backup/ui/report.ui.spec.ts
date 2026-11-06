import { test, expect } from '../../../core/fixtures.js';
import { ReportPage } from '../pages/report.page.js';
test.describe('Report management', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new ReportPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
