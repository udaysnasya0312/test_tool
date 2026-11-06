import { ScreenPage } from './common.js';
export class ReportPage extends ScreenPage {
  title = () => this.heading('Indicator Report Table');
  open = async () => { await this.openPath('/report-management'); };
}
