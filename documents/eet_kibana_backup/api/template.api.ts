import type { ApiTestEntry } from '../../../core/types.js';
import { call, missing, sample } from './common.js';
// /dashboard-template-1 screen.
const { indicator, database, countries, years } = sample;
const base = '/api/eet_ui/dashboard';
const selection = { indicatorId: indicator, country: countries, ...years };
export const templateRoutes: ApiTestEntry[] = [
  call('template - stat cards', 'POST', `${base}/cards`, { indicatorId: indicator }),
  call('template - average value', 'POST', `${base}/average`, selection),
  call('template - average over time', 'POST', `${base}/average_over_time`, selection),
  call('template - distribution', 'POST', `${base}/distribution`, selection),
  call('template - top indicators', 'POST', `${base}/top_indicators`, { country: countries, ...years, size: 5 }),
  call('template - regional performance', 'POST', `${base}/regional_performance`, selection),
  call('template - top indicator donut', 'POST', `${base}/top_indicator_donut`, { country: countries, ...years, size: 5 }),
  call('template - data availability', 'POST', `${base}/data_availability`, selection),
  call('template - top countries', 'POST', `${base}/top_countries`, { ...selection, size: 5 }),
  call('template - trend summary', 'POST', `${base}/trend_summary`, { country: countries, ...years, size: 5 }),
  call('template - indicator table', 'POST', `${base}/indicator_table`, { database, country: countries, ...years, page: 1, size: 5 }),
  call('template - global coverage', 'POST', `${base}/global_coverage`, selection),
  call('template - globe', 'POST', `${base}/globe`, selection),
  call('bad input - stat cards without indicator', 'POST', `${base}/cards`, {}, missing('indicatorId', 'string'), 400)
];
