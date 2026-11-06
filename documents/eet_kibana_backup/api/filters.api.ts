import type { ApiTestEntry } from '../../../core/types.js';
import { call, missing, sample } from './common.js';
// Filters shared by /eet, /corelate, /analytics, /dashboard-template-1 and /report-management, plus the main dashboard charts.
const { indicator, indicatorY, database, countries } = sample;
export const filtersRoutes: ApiTestEntry[] = [
  call('filters - country list', 'GET', '/getcountry'),
  call('filters - region list', 'GET', '/getregion'),
  call('filters - indicators of a database', 'POST', '/getindicators', { database }),
  call('filters - countries of a region', 'POST', '/getcountryonregion', { region: 'Asia' }),
  call('filters - valid years for one indicator', 'POST', '/getValidYearsForIndicators', { xIndicator: indicator }, { success: true }),
  call('filters - valid regions for one indicator', 'POST', '/getValidRegionsForIndicators', { xIndicator: indicator }, { success: true }),
  call('filters - valid years for indicator list', 'POST', '/getValidYearsForIndicatorsList', { indicators: [indicator], country: countries }, { success: true }),
  // Same payload shape as Pages/Home.tsx buildPayload for the default graph (bubble / zing); country is a JSON string.
  call('main dashboard - default bubble chart', 'POST', '/chart', { chartType: 'bubble', pluginType: 'zing', country: JSON.stringify(countries), indicatorsX: indicator, indicatorsY: indicatorY, minYear: '2000', maxYear: '2010' }),
  call('main dashboard - time series data', 'POST', '/api/eet/timeseries-data', { indicatorX: indicator, country: countries }),
  call('bad input - indicators without database', 'POST', '/getindicators', {}, missing('database', 'string'), 400)
];
