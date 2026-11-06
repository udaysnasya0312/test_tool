import { ScreenPage } from './common.js';
export class PrivacyPolicyPage extends ScreenPage {
  title = () => this.heading('Privacy & Policy');
  open = async () => { await this.openPath('/privacy-policy'); };
}
