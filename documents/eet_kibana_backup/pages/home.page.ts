import { ScreenPage } from './common.js';
export class HomePage extends ScreenPage {
  title = () => this.heading('Choose Your Data Source');
  open = async () => { await this.openPath('/'); };
}
