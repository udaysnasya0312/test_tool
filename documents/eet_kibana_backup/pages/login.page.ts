import type { Page } from '@playwright/test';
export class LoginPage {
  constructor(private readonly page: Page) {}
  // The login form has no data-test-subj or name attributes, so placeholders and the button label are used.
  username = () => this.page.getByPlaceholder('E-mail', { exact: true });
  password = () => this.page.getByPlaceholder('Password', { exact: true });
  // The header also has a "Login" button, so pick the one inside the form.
  signInButton = () => this.page.locator('form').getByRole('button', { name: 'Login', exact: true });
  open = async () => { await this.page.goto('/app/eetUi/login'); };
  signIn = async (username: string, password: string) => {
    await this.username().fill(username);
    await this.password().fill(password);
    await this.signInButton().click();
  };
}
