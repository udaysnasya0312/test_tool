import { test } from '../../../core/fixtures.js';
import { CustomDashboardPage } from '../pages/custom_dashboard.page.js';
const dashboardId = process.env.EET_DASHBOARD_ID || '';
test.describe('Custom dashboard', () => {
  test('saved dashboard opens cleanly', async ({ page }) => {
    const skip = dashboardId ? undefined : 'set EET_DASHBOARD_ID';
    test.skip(!!skip, skip);
    const screen = new CustomDashboardPage(page);
    await screen.open(`/custom-dashboard/${dashboardId}`);
    await screen.expectClean();
  });
});
