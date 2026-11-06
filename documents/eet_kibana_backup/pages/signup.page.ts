import { ScreenPage } from './common.js';
// /signup (auth/Signup.tsx). No data-test-subj or name attributes, so placeholders and labels are used.
export class SignupPage extends ScreenPage {
  title = () => this.heading('Sign Up');
  firstName = () => this.page.getByPlaceholder('First Name', { exact: true });
  lastName = () => this.page.getByPlaceholder('Last Name', { exact: true });
  email = () => this.page.getByPlaceholder('E-mail', { exact: true });
  password = () => this.page.getByPlaceholder('Password', { exact: true });
  confirmPassword = () => this.page.getByPlaceholder('Confirm New Password', { exact: true });
  terms = () => this.page.getByText('I agree to the terms of use and I have read the privacy policy', { exact: true });
  createAccountButton = () => this.page.getByRole('button', { name: 'Create Account', exact: true });
  loginLink = () => this.page.locator('.authShell__formLink').getByText('Login', { exact: true });
  // Shown only after /signup succeeds (an OTP email was sent); tests must never get here.
  otpTitle = () => this.heading('Enter OTP to verify account');
  open = async () => { await this.openPath('/signup'); };
  fill = async (form: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) => {
    await this.firstName().fill(form.firstName);
    await this.lastName().fill(form.lastName);
    await this.email().fill(form.email);
    await this.password().fill(form.password);
    await this.confirmPassword().fill(form.confirmPassword);
  };
}
