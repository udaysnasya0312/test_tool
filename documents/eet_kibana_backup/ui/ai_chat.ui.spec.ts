import { test } from '../../../core/fixtures.js';
import { AiChatPage } from '../pages/ai_chat.page.js';
test.describe('AI chat', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new AiChatPage(page);
    await screen.open();
    await screen.expectClean();
  });
});
