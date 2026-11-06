import { test, expect } from '../../../core/fixtures.js';
import { SignupPage } from '../pages/signup.page.js';
const username = process.env.EET_USERNAME || '';
test.use({ storageState: { cookies: [], origins: [] } });
// Every case stops before an OTP email is sent: the form checks run in the browser, and the only server call
// uses the already registered .env email, which /signup refuses before mailing.
const form = { firstName: 'TEST_first', lastName: 'TEST_last', email: 'test-user@example.com', password: 'TEST_pass1', confirmPassword: 'TEST_pass1' };
test.describe('Signup', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new SignupPage(page);
    await screen.open();
    await screen.expectClean();
    await expect(screen.title()).toBeVisible();
  });
  test('empty form asks for all fields', async ({ page }) => {
    const screen = new SignupPage(page);
    await screen.open();
    await screen.createAccountButton().click();
    await expect(page.getByText('Please fill all required fields.')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/eetUi\/signup/);
  });
  test('invalid email is refused', async ({ page }) => {
    const screen = new SignupPage(page);
    await screen.open();
    await screen.fill({ ...form, email: 'not-an-email' });
    await screen.createAccountButton().click();
    await expect(page.getByText('Invalid Email!')).toBeVisible();
  });
  test('passwords that differ are refused', async ({ page }) => {
    const screen = new SignupPage(page);
    await screen.open();
    await screen.fill({ ...form, confirmPassword: 'TEST_other' });
    await screen.createAccountButton().click();
    // Message text is as in the code (typo included).
    await expect(page.getByText('Password Not Macth!')).toBeVisible();
  });
  test('terms must be accepted', async ({ page }) => {
    const screen = new SignupPage(page);
    await screen.open();
    await screen.fill(form);
    await screen.createAccountButton().click();
    await expect(page.getByText('Please Accept Terms & Privacy!')).toBeVisible();
    await expect(screen.otpTitle()).toHaveCount(0);
  });
  test('already registered email is refused', async ({ page }) => {
    const screen = new SignupPage(page);
    await screen.open();
    await screen.fill({ ...form, email: username });
    await screen.terms().click();
    const signup = page.waitForResponse((response) => new URL(response.url()).pathname === '/signup');
    await screen.createAccountButton().click();
    await signup;
    await expect(page.getByText('User Already Exists!')).toBeVisible();
    await expect(screen.otpTitle()).toHaveCount(0);
  });
  test('login link goes to the login screen', async ({ page }) => {
    const screen = new SignupPage(page);
    await screen.open();
    await screen.loginLink().click();
    await expect(page).toHaveURL(/\/app\/eetUi\/login$/);
  });
});
