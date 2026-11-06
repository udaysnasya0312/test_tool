import { ScreenPage } from './common.js';
export class DocumentationPage extends ScreenPage {
  title = () => this.heading('API Documentation');
  open = async () => { await this.openPath('/documentation'); };
}
