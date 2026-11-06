import type { ApiTestEntry } from '../../../core/types.js';
import { call, sample } from './common.js';
// /admin-portal screens: indicator list, indicator detail, insert data (categories), system usage.
const { indicator, database } = sample;
export const adminRoutes: ApiTestEntry[] = [
  call('admin - indicator list', 'POST', '/api/getAllIndicators', { pageSize: 10, pageIndex: 0, search: '', category: '', database }),
  call('admin - indicator detail', 'POST', '/api/getIndicatorById', { id: indicator, year: [], country: [], pageSize: 10, pageIndex: 0, search: '' }),
  call('admin - indicator categories', 'POST', '/api/getIndicator/category', { database }),
  call('admin - system usage daily chart', 'POST', '/api/read-system-usages', { filter: 'day' })
];
