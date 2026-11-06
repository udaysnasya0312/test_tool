import { test } from '../../../core/fixtures.js';
import { ExamPage } from '../pages/exam.page.js';
const examId = process.env.EET_EXAM_ID || '';
test.describe('Exam', () => {
  test('opens cleanly', async ({ page }) => {
    const screen = new ExamPage(page);
    await screen.open('/exam');
    await screen.expectClean();
  });
  test('saved exam opens cleanly', async ({ page }) => {
    const skip = examId ? undefined : 'set EET_EXAM_ID';
    test.skip(!!skip, skip);
    const screen = new ExamPage(page);
    await screen.open(`/examview/${examId}`);
    await screen.expectClean();
  });
});
