import { ScreenPage } from './common.js';
export class ExamPage extends ScreenPage {
  open = async (path: string) => { await this.openPath(path); };
}
