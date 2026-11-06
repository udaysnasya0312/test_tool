import type { Request } from '@playwright/test';
import { ScreenPage } from './common.js';
// /dashboard-template-1 (templates/template1/Dashboard.tsx + FiltersBar.tsx). The combo boxes carry aria-labels in the code.
export class TemplatePage extends ScreenPage {
  title = () => this.heading('All Indicators Related Data');
  pageTitle = () => this.heading('Dashboard Template');
  open = async () => { await this.openPath('/dashboard-template-1'); };
  filters = () => this.page.locator('.eetFiltersBar');
  combo = (label: 'Select Database' | 'Select Indicator' | 'Select Region') => this.filters().getByRole('combobox', { name: label });
  option = (name: string) => this.page.getByRole('option', { name, exact: true });
  options = () => this.page.getByRole('option');
  countryButton = () => this.filters().locator('.eetFilterField', { hasText: 'Select Country' }).getByRole('button');
  clearFiltersButton = () => this.filters().getByRole('button', { name: 'Clear Filters' });
  waitForPost = (path: string, match: (body: Record<string, unknown>) => boolean = () => true) =>
    this.page.waitForRequest((request: Request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === path && match(request.postDataJSON()));
}
