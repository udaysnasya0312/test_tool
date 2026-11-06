import { ScreenPage } from './common.js';
export class EetPage extends ScreenPage {
  open = async (path: string) => { await this.openPath(path); };
}
