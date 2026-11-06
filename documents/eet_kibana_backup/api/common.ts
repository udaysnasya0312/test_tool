import type { ApiTestCase, ApiTestChain, HttpMethod } from '../../../core/types.js';
// Shared by every <area>.api.ts file.
// Kibana rejects POST/PUT/DELETE without this header (400).
export const xsrf = { 'kbn-xsrf': 'true' };
// Opening the app page (without kbn-xsrf) gives the anonymous Kibana session cookie that every API call needs.
export const openSession: ApiTestCase = { name: 'open app page to get Kibana session', method: 'GET', url: '/app/eetUi', auth: false, expectHttpStatus: 200 };
// One API call, preceded by opening a Kibana session.
export const call = (name: string, method: HttpMethod, url: string, payload?: unknown, expectBody?: unknown, expectHttpStatus = 200, skip?: string): ApiTestChain => ({
  name,
  rows: [openSession, { name, method, url, auth: false, headers: method === 'GET' ? undefined : xsrf, payload, expectHttpStatus, expectBody, skip }]
});
// Kibana's schema-validation message for a missing required body field.
export const missing = (field: string, type: 'string' | 'number' | 'array') => ({ message: `[request body.${field}]: expected value of type [${type}] but got [undefined]` });
// Real sample values: indicator 20 = "CO2 emissions (kt)", 31 = "Total greenhouse gas emissions", database "WorldBank".
export const sample = { indicator: '20', indicatorY: '31', database: 'WorldBank', countries: ['India', 'China'], years: { minYear: 2000, maxYear: 2010 } } as const;
// Calls that need the user's own records log in first and pick up ids from the responses (no ids in .env).
// Use {{userId}} in a step; a step can save more values, e.g. save: { examId: 'data.0._id' }.
// A payload value that is exactly '{{name}}' is replaced by the saved value as-is (object or array), not as text.
const loginStep: ApiTestCase = { name: 'login and save user id', method: 'POST', url: '/login', auth: false, headers: xsrf, payload: { email: process.env.EET_USERNAME || '', password: process.env.EET_PASSWORD || '' }, expectHttpStatus: 200, expectBody: { status: 200 }, save: { userId: 'data._id' } };
// options.cleanup: runs even when an earlier step failed (restore / delete what the chain created).
// options.waitMs: pause before the step (for writes that are not refreshed in Elasticsearch right away).
export interface StepOptions { readonly expectHttpStatus?: number; readonly cleanup?: boolean; readonly waitMs?: number }
export const step = (name: string, method: HttpMethod, url: string, payload?: unknown, expectBody?: unknown, save?: Record<string, string>, options: StepOptions = {}): ApiTestCase =>
  ({ name, method, url, auth: false, headers: method === 'GET' ? undefined : xsrf, payload, expectHttpStatus: options.expectHttpStatus ?? 200, expectBody, save, cleanup: options.cleanup, waitMs: options.waitMs });
// Write tests (Part 3) only touch records they create, named TEST_<what>_<run id>, or put back the values they read first.
const runId = Date.now();
export const testName = (what: string): string => `TEST_${what}_${runId}`;
export const asUser = (name: string, ...steps: ApiTestCase[]): ApiTestChain => ({ name, rows: [openSession, loginStep, ...steps] });
