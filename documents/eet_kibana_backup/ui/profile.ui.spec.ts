import { test } from '../../../core/fixtures.js';
import { ProfilePage } from '../pages/profile.page.js';
test.describe('Profile', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new ProfilePage(page);
    await screen.open();
    await screen.expectClean();
  });
});
