import type { PlaywrightTestConfig } from '@playwright/test';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuthConfig =
  | { method: 'none' }
  | { method: 'form'; loginPath: string; username: string; password: string; usernameSelector: string; passwordSelector: string; submitSelector: string }
  | {
      method: 'token'; loginPath: string; username: string; password: string; payload?: (username: string, password: string) => unknown;
      /** Where the token is in the login response, e.g. 'token' or 'data.accessToken'. */
      tokenPath: string;
      /** Header the token is sent in (default Authorization) and its prefix, e.g. 'Bearer '. Sent on every API row unless auth: false. */
      headerName?: string; prefix?: string;
      /** Where the frontend keeps its login in localStorage. value is a path in the login response; omitted = whole response. Stored as JSON if not a string. */
      browserStorage?: { key: string; value?: string };
    };
export interface AppConfig {
  name: string; baseUrl: string; apiBaseUrl: string;
  /** URL that answers 2xx when the app is up. Optional: baseUrl is checked when omitted. */
  healthCheckUrl?: string; auth: AuthConfig;
  defaultHeaders?: Record<string, string>; timeouts?: { test?: number; expect?: number; action?: number };
  startCommand?: { command: string; args?: string[]; cwd?: string };
  data?: { load: () => Promise<void>; cleanup: () => Promise<void> };
}
export interface ApiTestCase {
  name: string; method: HttpMethod; url: string; headers?: Record<string, string>; query?: Record<string, string | number | boolean>;
  payload?: unknown; expectHttpStatus: number;
  /** Partial match on the response. Arrays: each listed item is checked at its position; [] means the array must be empty. Special values: '<any>' (present, not null), '<string>', '<number>', '<boolean>', '<array>', '<object>'. */
  expectBody?: unknown; auth?: boolean; saveAs?: string; skip?: string; sideEffect?: boolean;
  timeout?: number;
  /** Save values from the response for later rows of the same chain: { varName: 'path.in.body' }, e.g. { userId: 'data._id', examId: 'data.0._id' }. Use as {{varName}}. */
  save?: Record<string, string>;
  /** Chains only: run this row even when an earlier row failed (restore or delete what the chain created). Missing {{values}} become empty instead of skipping. */
  cleanup?: boolean;
  /** Pause this many ms before sending (e.g. a write the backend makes searchable a moment later). */
  waitMs?: number;
  /** Send multipart/form-data instead of JSON (file uploads). A value { file } is read from the app folder, e.g. { file: 'data/sample.pdf' }. */
  multipart?: Record<string, string | number | boolean | { file: string; mimeType?: string }>;
  /** Pass when the request fails its status/body expectations; useful for negative cases. */
  expectFailure?: boolean;
}
export interface ApiTestChain { name: string; rows: ApiTestCase[] }
export type ApiTestEntry = ApiTestCase | ApiTestChain;
export interface ApiResult { name: string; method: string; url: string; expectedStatus: number; status?: number; body?: unknown; error?: string; durationMs: number; outcome: 'passed' | 'failed' | 'skipped' }
export interface FrameworkConfig extends PlaywrightTestConfig {}
