import { ScreenPage } from './common.js';
export class ProfilePage extends ScreenPage {
  open = async () => { await this.openPath('/profile'); };
}
