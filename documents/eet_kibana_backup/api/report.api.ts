import type { ApiTestEntry } from '../../../core/types.js';
import { call, sample } from './common.js';
// /report-management screen.
const { indicator, countries } = sample;
export const reportRoutes: ApiTestEntry[] = [
  call('report - report data', 'POST', '/api/reportData', { indicators: [indicator], year: ['2010'], country: countries }),
  call('report - countries of regions', 'POST', '/api/getcountryonregions', { regions: ['Asia'] })
];
