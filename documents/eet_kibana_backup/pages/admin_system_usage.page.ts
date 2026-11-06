import { ScreenPage } from './common.js';
export class AdminSystemUsagePage extends ScreenPage {
  title = () => this.heading('System Health');
  open = async () => { await this.openPath('/admin-portal/systemUsage'); };
}
