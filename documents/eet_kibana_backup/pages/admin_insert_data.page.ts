import { ScreenPage } from './common.js';
export class AdminInsertDataPage extends ScreenPage {
  title = () => this.heading('Drag & Drop Files');
  open = async () => { await this.openPath('/admin-portal/indicator/insert'); };
}
