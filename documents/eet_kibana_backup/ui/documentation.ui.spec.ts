import { test, expect } from '../../../core/fixtures.js';
import { DocumentationPage } from '../pages/documentation.page.js';
test.describe('Documentation', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new DocumentationPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
});
