import { ScreenPage } from './common.js';
export class AdminPortalPage extends ScreenPage {
  title = () => this.heading('Admin Controls');
  open = async () => { await this.openPath('/admin-portal'); };
}
