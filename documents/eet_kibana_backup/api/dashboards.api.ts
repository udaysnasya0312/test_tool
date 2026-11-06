import type { ApiTestEntry } from '../../../core/types.js';
import { asUser, call, step } from './common.js';
// Saved dashboards (sidebar list, /custom-dashboard/:id) and the main dashboard's saved graph layout (read-only calls).
export const dashboardsRoutes: ApiTestEntry[] = [
  asUser('saved dashboards - my dashboards', step('saved dashboards - my dashboards', 'POST', '/api/readDashboard', { user_id: '{{userId}}' })),
  // "from" is a 1-based page number.
  call('saved dashboards - all dashboards', 'POST', '/api/readAllDashboard', { from: 1, size: 5, search: '' }),
  asUser('saved dashboards - one dashboard',
    step('find a dashboard of this user', 'POST', '/api/readDashboard', { user_id: '{{userId}}' }, undefined, { dashboardId: 'data.0._id' }),
    step('saved dashboards - one dashboard', 'POST', '/api/readDashboard/id', { id: '{{dashboardId}}' })),
  asUser('main dashboard - saved graph layout', step('main dashboard - saved graph layout', 'POST', '/api/newDashboard/getDashboardGraphs', { user_id: '{{userId}}' }))
];
