import { test, expect } from '../../../core/fixtures.js';
import { HomePage } from '../pages/home.page.js';
test.describe('Home', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new HomePage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
