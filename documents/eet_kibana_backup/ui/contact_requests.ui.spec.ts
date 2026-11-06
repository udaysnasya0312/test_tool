import { test, expect } from '../../../core/fixtures.js';
import { ContactRequestsPage } from '../pages/contact_requests.page.js';
test.describe('Contact requests', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new ContactRequestsPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
