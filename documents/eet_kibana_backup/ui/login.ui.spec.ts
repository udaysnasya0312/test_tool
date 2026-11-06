import { test, expect } from '../../../core/fixtures.js';
import { LoginPage } from '../pages/login.page.js';
const username = process.env.EET_USERNAME || '';
const password = process.env.EET_PASSWORD || '';
test.use({ storageState: { cookies: [], origins: [] } });   // every login test starts logged out
test.describe('Login', () => {
  test('valid user logs in and reaches the dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.signIn(username, password);
    await expect(page.getByText('User Login Successfully!')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/eetUi\/?$/);
  });
  test('wrong password shows an error and stays on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.signIn(username, 'wrong-password');
    await expect(page.getByText('User Not Exists!')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/eetUi\/login/);
  });
  test('invalid email format shows an error and stays on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.signIn('not-an-email', 'wrong-password');
    await expect(page.getByText('Invalid Email!')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/eetUi\/login/);
  });
  test('empty form shows an error and stays on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.signInButton().click();
    await expect(page.getByText('Invalid Email!')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/eetUi\/login/);
  });
});
