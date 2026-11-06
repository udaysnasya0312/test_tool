import { test } from '../../../core/fixtures.js';
import { ExamListPage } from '../pages/exam_list.page.js';
test.describe('Exam list', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new ExamListPage(page);
    await screen.open();
    await screen.expectClean();
  });
});
