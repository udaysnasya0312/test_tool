import { ScreenPage } from './common.js';
export class ExamListPage extends ScreenPage {
  open = async () => { await this.openPath('/examview'); };
}
