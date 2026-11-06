import { test, expect } from '../../../core/fixtures.js';
import { ContactUsPage } from '../pages/contact_us.page.js';
test.describe('Contact us', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new ContactUsPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
