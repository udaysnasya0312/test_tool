import { ScreenPage } from './common.js';
export class ContactUsPage extends ScreenPage {
  title = () => this.heading('Contact Us');
  open = async () => { await this.openPath('/contact-us'); };
}
