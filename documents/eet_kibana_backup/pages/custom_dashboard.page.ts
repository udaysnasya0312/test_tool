import { ScreenPage } from './common.js';
export class CustomDashboardPage extends ScreenPage {
  open = async (path: string) => { await this.openPath(path); };
}
