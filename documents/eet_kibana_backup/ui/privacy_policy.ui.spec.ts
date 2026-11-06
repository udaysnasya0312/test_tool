import { test, expect } from '../../../core/fixtures.js';
import { PrivacyPolicyPage } from '../pages/privacy_policy.page.js';
test.describe('Privacy policy', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new PrivacyPolicyPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
