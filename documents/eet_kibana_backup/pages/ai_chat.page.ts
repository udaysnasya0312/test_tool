import { ScreenPage } from './common.js';
export class AiChatPage extends ScreenPage {
  open = async () => { await this.openPath('/ai-chat'); };
}
