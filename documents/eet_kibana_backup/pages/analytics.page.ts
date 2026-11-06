import type { Request } from '@playwright/test';
import { ScreenPage } from './common.js';
// /analytics (analytics/Analytics.tsx + DashboardHeader.tsx). No data-test-subj, so labels and classes from the code are used.
// The seven cards and the API call each one loads (all POST, body has indicatorid, countries and years).
export const analyticsCards = [
  { title: 'Indicator Overview', path: '/api/indicatorOverview' },
  { title: 'Country Comparison Breakdown', path: '/api/getCountryComparison' },
  { title: 'Detailed Country Metrics', path: '/api/getDetailedMetrics' },
  { title: 'Correlation Heatmap', path: '/api/getCorrelationHeatmap' },
  { title: 'Regional Flow', path: '/api/getRegionalFlow' },
  { title: 'Latest Country Records', path: '/api/getLatestCountryRecords' },
  { title: 'Yearly Growth Analysis', path: '/api/getYearlyGrowth' }
] as const;
export class AnalyticsPage extends ScreenPage {
  open = async () => { await this.openPath('/analytics'); };
  title = () => this.heading('World Bank Indicators Explorer');
  liveBadge = () => this.page.locator('.live-badge');
  cardTitle = (title: string) => this.page.locator('h3.panel-title', { hasText: title });
  // Each header control is a label + EuiSuperSelect (a button that opens a list of options).
  control = (label: string) => this.page.locator('.control-group').filter({ has: this.page.locator('.control-label', { hasText: label }) });
  select = (label: string) => this.control(label).getByRole('button').first();
  options = () => this.page.getByRole('option');
  countryButton = () => this.select('Select Countries');
  applyButton = () => this.page.locator('.dashboard-header').getByRole('button', { name: 'Apply', exact: true });
  clearButton = () => this.page.locator('.dashboard-header').getByRole('button', { name: 'Clear', exact: true });
  waitForPost = (path: string, match: (body: Record<string, unknown>) => boolean = () => true) =>
    this.page.waitForRequest((request: Request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === path && match(request.postDataJSON()));
  // Resolves when all seven card calls have been sent.
  waitForAllCards = (match?: (body: Record<string, unknown>) => boolean) => Promise.all(analyticsCards.map(({ path }) => this.waitForPost(path, match)));
}
