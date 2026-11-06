import { ScreenPage } from './common.js';
export class UserManagementPage extends ScreenPage {
  title = () => this.heading('Users');
  open = async () => { await this.openPath('/user-management'); };
}
