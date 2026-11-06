import { expect, request as playwrightRequest, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { ApiResult, ApiTestCase, ApiTestEntry, AppConfig } from './types.js';
import { authHeadersPath } from './login.js';
import { reportDirectory } from './report_paths.js';
const results = new Map<string, ApiResult[]>();
function substitute(value: any, vars: Record<string, any>): any {
  // A value that is exactly '{{name}}' is replaced by the saved value as-is, so objects and arrays stay objects and arrays.
  const whole = typeof value === 'string' ? value.match(/^{{([^}]+)}}$/) : null;
  if (whole) return vars[whole[1].trim()] ?? '';
  if (typeof value === 'string') return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => String(vars[key.trim()] ?? ''));
  if (Array.isArray(value)) return value.map(v => substitute(v, vars));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substitute(v, vars)]));
  return value;
}
const typeChecks: Record<string, (v: any) => boolean> = {
  '<any>': v => v !== undefined && v !== null, '<string>': v => typeof v === 'string', '<number>': v => typeof v === 'number',
  '<boolean>': v => typeof v === 'boolean', '<array>': v => Array.isArray(v), '<object>': v => !!v && typeof v === 'object' && !Array.isArray(v)
};
// Returns one line per field that differs, e.g. "data.status: expected 200, got 400". Empty = match.
function mismatches(actual: any, expected: any, at = 'body'): string[] {
  if (typeof expected === 'string' && typeChecks[expected]) return typeChecks[expected](actual) ? [] : [`${at}: expected ${expected}, got ${JSON.stringify(actual)}`];
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return [`${at}: expected an array, got ${JSON.stringify(actual)}`];
    if (!expected.length) return actual.length ? [`${at}: expected an empty array, got ${actual.length} items`] : [];
    return expected.flatMap((v, i) => i < actual.length ? mismatches(actual[i], v, `${at}.${i}`) : [`${at}.${i}: missing (array has ${actual.length} items)`]);
  }
  if (expected && typeof expected === 'object') return Object.entries(expected).flatMap(([k, v]) => mismatches(actual?.[k], v, `${at}.${k}`));
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${at}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
}
async function recordSkipped(row: ApiTestCase, vars: Record<string, any>, config: AppConfig, name: string, reason: string): Promise<void> {
  const skipped: ApiResult = { name, method: row.method, url: new URL(substitute(row.url, vars), config.apiBaseUrl).href, expectedStatus: row.expectHttpStatus, error: reason, durationMs: 0, outcome: 'skipped' };
  await mkdir(reportDirectory(config.name), { recursive: true });
  await appendFile(path.join(reportDirectory(config.name), 'api_results.jsonl'), `${JSON.stringify(skipped)}\n`);
  test.info().attach('API result', { body: Buffer.from(JSON.stringify(skipped, null, 2)), contentType: 'application/json' });
}
function newApiContext(config: AppConfig, auth: boolean | undefined): Promise<APIRequestContext> {
  // Logged-in rows reuse the saved session: cookies (storageState) and, for token login, the auth header.
  const headersFile = authHeadersPath(config.name);
  const authHeaders = auth !== false && existsSync(headersFile) ? JSON.parse(readFileSync(headersFile, 'utf8')) : {};
  return playwrightRequest.newContext({ baseURL: config.apiBaseUrl, storageState: auth === false ? { cookies: [], origins: [] } : path.join(reportDirectory(config.name), 'storageState.json'), extraHTTPHeaders: { ...config.defaultHeaders, ...authHeaders } });
}
async function runRow(row: ApiTestCase, vars: Record<string, any>, config: AppConfig, request: APIRequestContext, chainName?: string, shared?: APIRequestContext): Promise<'passed'|'failed'|'skipped'> {
  const name = chainName ? `${chainName} / ${row.name}` : row.name;
  if (row.skip || row.sideEffect) {
    const reason = row.skip ?? 'Side effects are skipped by default';
    await recordSkipped(row, vars, config, name, reason);
    test.skip(true, reason);
    return 'skipped';
  }
  // A {{value}} that an earlier row did not provide (e.g. an empty list) skips this row with a clear reason.
  const needed = [...JSON.stringify([row.url, row.payload, row.query, row.headers]).matchAll(/{{([^}]+)}}/g)].map(m => m[1].trim());
  // Cleanup rows run with empty values that were read (a field the record never had), but never with values whose
  // reading step did not run: restoring or deleting with blanks could damage real data.
  const unavailable = [...new Set(needed.filter(k => row.cleanup ? !(k in vars) : vars[k] === undefined || vars[k] === null || vars[k] === ''))];
  if (unavailable.length) {
    const reason = `No value for ${unavailable.map(k => `{{${k}}}`).join(', ')}: an earlier step did not return it`;
    await recordSkipped(row, vars, config, name, reason);
    test.skip(true, reason);
    return 'skipped';
  }
  if (row.waitMs) await new Promise(r => setTimeout(r, row.waitMs));
  const url = new URL(substitute(row.url, vars), config.apiBaseUrl);
  for (const [k, v] of Object.entries(row.query ?? {})) url.searchParams.set(k, String(substitute(v, vars)));
  const started = Date.now();
  let status: number | undefined, body: unknown, error: string | undefined;
  let context: APIRequestContext | undefined;
  try {
    // Rows in a chain share one context, so cookies set by one row reach the next.
    context = shared ?? await newApiContext(config, row.auth);
    const multipart = row.multipart ? Object.fromEntries(await Promise.all(Object.entries(row.multipart).map(async ([k, v]) =>
      [k, typeof v === 'object' ? { name: path.basename(v.file), mimeType: v.mimeType ?? 'application/octet-stream', buffer: await readFile(path.join('apps', config.name, v.file)) } : substitute(v, vars)]))) : undefined;
    const response = await context.fetch(url.href, { method: row.method, headers: substitute(row.headers, vars), ...(multipart ? { multipart } : { data: substitute(row.payload, vars) }), timeout: row.timeout });
    status = response.status();
    const text = await response.text();
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    expect(status, 'HTTP status').toBe(row.expectHttpStatus);
    const diff = row.expectBody === undefined ? [] : mismatches(body, substitute(row.expectBody, vars));
    if (diff.length) throw new Error(`Response body does not match:\n  ${diff.join('\n  ')}`);
    for (const [key, at] of Object.entries(row.save ?? {})) vars[key] = at.split('.').reduce((v: any, part) => v?.[part], body);
    if (row.saveAs) vars[row.saveAs] = row.saveAs === 'id' ? (body as any)?.id ?? (body as any)?.data?.id : body;
  } catch (e) { error = (e instanceof Error ? e.message : String(e)).replace(/\u001b\[[0-9;]*m/g, ''); }
  finally { if (!shared) await context?.dispose(); }
  if (row.expectFailure && !error) error = 'Expected this API check to fail, but its status and body matched.';
  const outcome = row.expectFailure ? (error?.startsWith('Expected this API check') ? 'failed' : 'passed') : error ? 'failed' : 'passed';
  const result: ApiResult = { name, method: row.method, url: url.href, expectedStatus: row.expectHttpStatus, status, body, error, durationMs: Date.now() - started, outcome };
  const list = results.get(config.name) ?? []; list.push(result); results.set(config.name, list);
  await mkdir(reportDirectory(config.name), { recursive: true });
  await appendFile(path.join(reportDirectory(config.name), 'api_results.jsonl'), `${JSON.stringify(result)}\n`);
  test.info().attach('API result', { body: Buffer.from(JSON.stringify(result, null, 2)), contentType: 'application/json' });
  if (error && !row.expectFailure) throw new Error(`API ${row.method} ${url.href} failed: ${error}\nResponse: ${JSON.stringify(body)}`);
  if (row.expectFailure && outcome === 'failed') throw new Error(`API ${row.method} ${url.href} unexpectedly passed its expectations.`);
  return outcome;
}
export async function runApiEntry(entry: ApiTestEntry, config: AppConfig, request: APIRequestContext): Promise<void> {
  if ('rows' in entry) {
    await test.step(`API chain: ${entry.name}`, async () => {
      const vars: Record<string, any> = {}; let failure: unknown;
      const shared = await newApiContext(config, entry.rows[0]?.auth);
      for (const row of entry.rows) {
        // After a failure only cleanup rows still run; the chain keeps its first error.
        if (failure && !row.cleanup) { await recordSkipped(row, vars, config, `${entry.name} / ${row.name}`, 'Previous row in chain failed'); continue; }
        try { await runRow(row, vars, config, request, entry.name, shared); } catch (e) { failure ??= e; }
      }
      await shared.dispose();
      if (failure) throw failure;
    });
  } else await runRow(entry, {}, config, request);
}
export async function flushApiResults(name: string): Promise<void> { const target = path.join(reportDirectory(name), 'api_results.json'); await mkdir(reportDirectory(name), { recursive: true }); await writeFile(target, JSON.stringify(results.get(name) ?? [], null, 2)); }
