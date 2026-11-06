import { ScreenPage } from './common.js';
export class AdminIndicatorsPage extends ScreenPage {
  open = async () => { await this.openPath('/admin-portal/indicator'); };
}
