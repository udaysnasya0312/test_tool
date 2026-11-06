import { test, expect } from '../../../core/fixtures.js';
import { TemplatePage } from '../pages/template.page.js';
// Read-only screen: every card loads from /api/eet_ui/dashboard/* with the filters in the body.
test.describe('Template dashboard', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new TemplatePage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
  test('loads the cards for the first indicator and all countries', async ({ page }) => {
    const screen = new TemplatePage(page);
    const cards = screen.waitForPost('/api/eet_ui/dashboard/cards', (body) => Boolean(body.indicatorId));
    const average = screen.waitForPost('/api/eet_ui/dashboard/average', (body) => (body.country as string[]).length > 0 && Number(body.minYear) > 0);
    await screen.open();
    await Promise.all([cards, average]);
    await expect(screen.pageTitle()).toBeVisible();
    await expect(screen.combo('Select Database')).toHaveValue('WorldBank');
    await expect(screen.countryButton()).toHaveText(/^\d+ selected$/);
    await screen.expectClean();
  });
  test('a new indicator reloads the cards for it', async ({ page }) => {
    const screen = new TemplatePage(page);
    await screen.open();
    const current = await screen.combo('Select Indicator').inputValue();
    await screen.combo('Select Indicator').click();
    const next = screen.options().filter({ hasNotText: current }).first();
    const name = (await next.innerText()).trim();
    const years = screen.waitForPost('/getValidYearsForIndicators');
    await next.click();
    const indicator = String((await years).postDataJSON().xIndicator);
    await screen.waitForPost('/api/eet_ui/dashboard/cards', (body) => String(body.indicatorId) === indicator);
    await expect(screen.combo('Select Indicator')).toHaveValue(name);
    await screen.expectClean();
  });
  test('a region loads its own countries', async ({ page }) => {
    const screen = new TemplatePage(page);
    await screen.open();
    await screen.combo('Select Region').click();
    // The first option is "World Region"; the second is a real region from /getregion.
    const region = screen.options().nth(1);
    const name = (await region.innerText()).trim();
    const countries = screen.waitForPost('/getcountryonregion', (body) => body.region === name);
    await region.click();
    await countries;
    await expect(screen.combo('Select Region')).toHaveValue(name);
    await screen.expectClean();
  });
  test('removing a country sends one country less', async ({ page }) => {
    const screen = new TemplatePage(page);
    await screen.open();
    const count = Number((await screen.countryButton().innerText()).match(/\d+/)?.[0]);
    await screen.countryButton().click();
    const average = screen.waitForPost('/api/eet_ui/dashboard/average', (body) => (body.country as string[]).length === count - 1);
    await page.getByRole('option', { checked: true }).first().click();
    await average;
    await expect(screen.countryButton()).toHaveText(`${count - 1} selected`);
  });
  test('clear filters empties the indicator and countries', async ({ page }) => {
    const screen = new TemplatePage(page);
    await screen.open();
    await screen.clearFiltersButton().click();
    await expect(screen.combo('Select Indicator')).toHaveValue('');
    await expect(screen.countryButton()).toHaveText('Select countries');
    await expect(screen.combo('Select Database')).toHaveValue('WorldBank');
  });
});
