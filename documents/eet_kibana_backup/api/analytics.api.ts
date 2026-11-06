import type { ApiTestEntry } from '../../../core/types.js';
import { call, missing, sample } from './common.js';
// /analytics screen.
const { indicator, countries, years } = sample;
const selection = { indicatorid: indicator, selectedCountries: countries, ...years };
export const analyticsRoutes: ApiTestEntry[] = [
  call('analytics - indicator overview', 'POST', '/api/indicatorOverview', { indicatorid: indicator, countryName: countries, ...years }, { success: true }),
  call('analytics - country comparison', 'POST', '/api/getCountryComparison', { indicatorid: indicator, selectedCountries: countries, year: 2010 }, { success: true }),
  call('analytics - correlation heatmap', 'POST', '/api/getCorrelationHeatmap', selection, { success: true }),
  call('analytics - regional flow', 'POST', '/api/getRegionalFlow', selection, { success: true }),
  call('analytics - latest country records', 'POST', '/api/getLatestCountryRecords', selection, { success: true }),
  call('analytics - yearly growth', 'POST', '/api/getYearlyGrowth', selection, { success: true }),
  call('analytics - detailed metrics', 'POST', '/api/getDetailedMetrics', selection, { success: true }),
  call('bad input - yearly growth without year range', 'POST', '/api/getYearlyGrowth', { indicatorid: indicator, selectedCountries: countries }, missing('minYear', 'number'), 400)
];
