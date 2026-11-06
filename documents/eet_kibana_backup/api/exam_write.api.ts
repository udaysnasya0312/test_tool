import type { ApiTestEntry } from '../../../core/types.js';
import { asUser, missing, sample, step, testName } from './common.js';
// Write tests for the exam result (/exam saves it, /examview lists and deletes it). Only the TEST_ exam made here is deleted.
const examName = testName('exam');
const question = { question: 'TEST_ question', options: [{ label: 'A', value: 1 }, { label: 'B', value: 2 }], answer: 1 };
export const examWriteRoutes: ApiTestEntry[] = [
  asUser('exam result - save, list, view, delete',
    step('save exam', 'POST', '/api/exam/save',
      { userId: '{{userId}}', examName, description: 'TEST_ created by API tests', answers: { 0: '1' }, questions: [question], selectedIndicators: [sample.indicator] },
      { status: 'success', message: 'Exam saved successfully' }),
    // The save is not refreshed in Elasticsearch, so wait before searching. The save response has no id.
    step('find it in my list', 'POST', '/api/exam/list', { userId: '{{userId}}', page: 1, size: 1, search: examName },
      { totalCount: 1, data: [{ _source: { examName, userId: '{{userId}}' } }] }, { examId: 'data.0._id' }, { waitMs: 2000 }),
    step('view it', 'GET', '/api/exam/view/{{examId}}', undefined, { data: { examName, selectedIndicators: [sample.indicator] } }),
    step('delete it', 'DELETE', '/api/exam/delete', { id: '{{examId}}' }, { status: 'success', message: 'Exam deleted successfully' }, undefined, { cleanup: true }),
    step('it is gone', 'GET', '/api/exam/view/{{examId}}', undefined, { status: 'error' })),
  // Known bug: the /exam screen autosaves every 20 s with { currentQuestion, timeLeft, userAnswers }, which the route
  // rejects. Nothing is saved, so this row is safe.
  asUser('bad input - exam autosave payload from the /exam screen',
    step('bad input - exam autosave payload from the /exam screen', 'POST', '/api/exam/save', { currentQuestion: 0, timeLeft: 600, userAnswers: {} },
      missing('userId', 'string'), undefined, { expectHttpStatus: 400 }))
];
