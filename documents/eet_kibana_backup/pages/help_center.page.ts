import { ScreenPage } from './common.js';
export class HelpCenterPage extends ScreenPage {
  title = () => this.heading('How can we help you today?');
  open = async () => { await this.openPath('/help-center'); };
}
