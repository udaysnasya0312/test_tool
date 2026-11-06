import type { ApiTestEntry } from '../../../core/types.js';
import { asUser, step, testName } from './common.js';
// Write tests for saved dashboards (/eet "Save Graph", /custom-dashboard/:id) and the main dashboard's saved graph layout.
// Only the TEST_ dashboard made here is deleted; the user's graph layout is read first and put back at the end.
const name = testName('dashboard');
const renamed = testName('dashboard_renamed');
const graph = { id: 'TEST_graph', title: 'TEST_graph', graphType: 'bubble', chartType: 'bubble', graphPlugin: 'zing', filters: null };
const layout = [{ i: 'TEST_graph', x: 0, y: 0, w: 12, h: 12 }];
const filterSetting = { datasource: true, xaxis: true, yaxis: true, region: true, country: true, year: true, rangeYear: true };
export const dashboardsWriteRoutes: ApiTestEntry[] = [
  asUser('saved dashboard - create, read, update, delete',
    step('create dashboard', 'POST', '/api/saveDashboard', { name, description: 'TEST_ created by API tests', graphs: [graph], layout, autoRefresh: 10, filterSetting, user_id: '{{userId}}' },
      { message: 'Dashboard saved successfully', data: { name, user_id: '{{userId}}' } }),
    // The save response has no id, so the new record is found by its unique name ("from" is 1-based).
    step('find the new dashboard', 'POST', '/api/readAllDashboard', { from: 1, size: 1, search: name }, { totalCounts: 1, data: [{ _source: { name } }] }, { dashboardId: 'data.0._id' }),
    step('same name again is refused', 'POST', '/api/saveDashboard', { name, description: '', graphs: [graph], layout, autoRefresh: 10, filterSetting, user_id: '{{userId}}' },
      { message: 'Dashboard name already exists' }, undefined, { expectHttpStatus: 400 }),
    step('read it by id', 'POST', '/api/readDashboard/id', { id: '{{dashboardId}}' }, [{ _id: '{{dashboardId}}', _source: { name, user_id: '{{userId}}' } }]),
    step('update it', 'PUT', '/api/updateDashboard', { id: '{{dashboardId}}', name: renamed, graphs: [graph], layout, autoRefresh: 20, filterSetting },
      { message: 'Dashboard updated successfully' }),
    step('read the new name', 'POST', '/api/readDashboard/id', { id: '{{dashboardId}}' }, [{ _source: { name: renamed, dashboard: { autoRefresh: 20 } } }]),
    // Known bug: update replaces the whole record, so user_id, description and createdAt are lost and the
    // dashboard drops out of the owner's list. This step fails until that is fixed; the delete below still runs.
    step('update keeps the owner', 'POST', '/api/readDashboard/id', { id: '{{dashboardId}}' }, [{ _source: { user_id: '{{userId}}' } }]),
    step('delete it', 'DELETE', '/api/deleteDashboard', { id: '{{dashboardId}}' }, { status: true, message: 'Dashboard Deleted successfully' }, undefined, { cleanup: true }),
    step('it is gone', 'POST', '/api/readDashboard/id', { id: '{{dashboardId}}' }, [])),
  asUser('main dashboard graph layout - save and restore',
    step('read the current layout', 'POST', '/api/newDashboard/getDashboardGraphs', { user_id: '{{userId}}' }, undefined,
      { originalGraphs: 'graphs', originalLayout: 'layout', originalWishList: 'wishList' }),
    step('save a TEST_ layout', 'POST', '/api/newDashboard/saveDashboardGraphs', { user_id: '{{userId}}', graphs: [graph], layout, wishList: ['TEST_graph'] }, { success: true }),
    step('read it back', 'POST', '/api/newDashboard/getDashboardGraphs', { user_id: '{{userId}}' },
      { graphs: [{ id: 'TEST_graph', title: 'TEST_graph' }], layout: [{ i: 'TEST_graph' }], wishList: ['TEST_graph'] }),
    step('put the original layout back', 'POST', '/api/newDashboard/saveDashboardGraphs',
      { user_id: '{{userId}}', graphs: '{{originalGraphs}}', layout: '{{originalLayout}}', wishList: '{{originalWishList}}' }, { success: true }, undefined, { cleanup: true }))
];
