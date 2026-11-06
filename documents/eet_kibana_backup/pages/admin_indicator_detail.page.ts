import { ScreenPage } from './common.js';
export class AdminIndicatorDetailPage extends ScreenPage {
  open = async () => { await this.openPath('/admin-portal/indicator/20'); };
}
