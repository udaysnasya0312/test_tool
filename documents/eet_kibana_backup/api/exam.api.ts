import type { ApiTestEntry } from '../../../core/types.js';
import { asUser, call, sample, step } from './common.js';
// /exam, /examview and /examview/:id screens (read-only calls).
export const examRoutes: ApiTestEntry[] = [
  call('exam - questions for indicators', 'POST', '/api/exam/questions', { indicators: [sample.indicator] }),
  asUser('exam - my exam list', step('exam - my exam list', 'POST', '/api/exam/list', { userId: '{{userId}}', page: 1, size: 5, search: '' })),
  call('exam - all exam list', 'POST', '/api/exam/all/list', { page: 1, size: 5, search: '' }),
  asUser('exam - view one exam',
    step('find an exam of this user', 'POST', '/api/exam/list', { userId: '{{userId}}', page: 1, size: 1, search: '' }, undefined, { examId: 'data.0._id' }),
    step('exam - view one exam', 'GET', '/api/exam/view/{{examId}}'))
];
