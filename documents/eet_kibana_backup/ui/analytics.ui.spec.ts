import { test, expect } from '../../../core/fixtures.js';
import { AnalyticsPage, analyticsCards } from '../pages/analytics.page.js';
// Read-only screen: it only loads data. The card layout is kept in localStorage, which starts empty in every test.
const countriesOf = (body: Record<string, unknown>) => (body.countryName ?? body.selectedCountries) as string[];
test.describe('Analytics', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new AnalyticsPage(page);
    await screen.open();
    await screen.expectClean();
  });
  test('loads all seven cards for the first indicator and five countries', async ({ page }) => {
    const screen = new AnalyticsPage(page);
    const cards = screen.waitForAllCards((body) => Boolean(body.indicatorid) && countriesOf(body).length === 5);
    await screen.open();
    await cards;
    await expect(screen.title()).toBeVisible();
    await expect(screen.liveBadge()).toHaveText('LIVE');
    for (const { title } of analyticsCards) await expect(screen.cardTitle(title)).toBeVisible();
    await expect(screen.select('Select Data Source')).toContainText('WorldBank');
    await expect(screen.countryButton()).toHaveText('5 countries selected');
    await screen.expectClean();
  });
  test('apply reloads every card', async ({ page }) => {
    const screen = new AnalyticsPage(page);
    await screen.open();
    const cards = screen.waitForAllCards();
    await screen.applyButton().click();
    await cards;
    await screen.expectClean();
  });
  test('clear reloads every card', async ({ page }) => {
    const screen = new AnalyticsPage(page);
    await screen.open();
    const cards = screen.waitForAllCards();
    await screen.clearButton().click();
    await cards;
    await screen.expectClean();
  });
  test('a new indicator loads its years, and apply uses it', async ({ page }) => {
    const screen = new AnalyticsPage(page);
    await screen.open();
    await screen.select('Select Indicator').click();
    // Pick the second indicator in the list (the first is selected by default).
    const second = screen.options().nth(1);
    const name = (await second.innerText()).trim();
    const years = screen.waitForPost('/getValidYearsForIndicators');
    await second.click();
    const yearsRequest = await years;
    const indicator = String(yearsRequest.postDataJSON().xIndicator);
    await expect(screen.select('Select Indicator')).toContainText(name);
    const cards = screen.waitForAllCards((body) => body.indicatorid === indicator);
    await screen.applyButton().click();
    await cards;
    await screen.expectClean();
  });
  test('removing a country sends one country less', async ({ page }) => {
    const screen = new AnalyticsPage(page);
    await screen.open();
    await screen.countryButton().click();
    await page.getByRole('option', { checked: true }).first().click();
    await expect(screen.countryButton()).toHaveText('4 countries selected');
    await page.keyboard.press('Escape');
    const cards = screen.waitForAllCards((body) => countriesOf(body).length === 4);
    await screen.applyButton().click();
    await cards;
    await screen.expectClean();
  });
  test('a region loads its own countries', async ({ page }) => {
    const screen = new AnalyticsPage(page);
    await screen.open();
    await screen.select('Select Regions').click();
    // The first option is "World Region"; the second is a real region from /getregion.
    const region = screen.options().nth(1);
    const name = (await region.innerText()).trim();
    const countries = screen.waitForPost('/getcountryonregion', (body) => body.region === name);
    await region.click();
    await countries;
    await expect(screen.select('Select Regions')).toContainText(name);
    await screen.expectClean();
  });
});
