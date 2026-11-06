# Prompt for the AI agent on the application server

Copy everything below the line and give it to the agent. Replace `<app_name>` first (lowercase, no spaces, e.g. `inventory`).

---

You are working on the server where our application's source code lives. A separate Playwright test
framework runs on another machine and reaches this app only over HTTP. Your job: read this app's code and
produce the app-specific test files for that framework. Do not change the application itself.

## Background: why this exists

- Today this app is tested by hand: someone opens pages and clicks through them after every change. That is
  slow and things get missed.
- We built one shared test framework that tests many apps automatically, both the screens (in a real browser)
  and the backend APIs. One command runs everything and produces one HTML report with pass/fail, status
  codes, error messages, screenshots and videos.
- The framework never changes per app. Each app plugs in through its own folder (`apps/<app_name>/`), which
  holds only that app's facts: URLs, login details, routes and screen selectors. That folder is what you're
  making.
- The test machine can't see this app's source code, only its URLs. You can see the code, so you're the one
  who can get routes, messages and field names right instead of guessed.
- We start with login because every other test depends on it, and it changes no data. Other features come
  later, using the route list you put in NOTES.md.
- Your files will be copied to the test machine, the real password goes into `.env` there, and the tests
  run with `npm test <app_name>`.

## What to produce

Create one folder, `<app_name>/`, with exactly this layout:

```
<app_name>/
  .env.example          URLs and login keys, values empty for secrets
  app_config.ts         reads the .env values
  api/login.api.ts      API test table for login
  api/login.api.spec.ts runs that table (copy as given below)
  pages/login.page.ts   where the login screen's fields and button are
  ui/login.ui.spec.ts   browser tests for login
  NOTES.md              findings (see the last section)
```

File naming (always follow it, for every feature):

| Folder | Pattern | Example |
|---|---|---|
| `api/` | `<feature>.api.ts`: the API test table, exported as `<feature>Routes` | `login.api.ts` â†’ `loginRoutes` |
| `api/` | `<feature>.api.spec.ts`: runs that table | `login.api.spec.ts` |
| `ui/` | `<feature>.ui.spec.ts`: browser tests | `login.ui.spec.ts` |
| `pages/` | `<screen>.page.ts`: one class per screen, named `<Screen>Page` | `login.page.ts` â†’ `LoginPage` |

Feature and screen names are lowercase; join words with `_` (e.g. `user_management.api.ts`).

Start with login only: public routes, the login route, and the login screen. Don't write tests that create,
update or delete data yet. List those routes in NOTES.md instead.

## Rules

- Never put a password, token or real user data in any file. Read them from `process.env` (see examples).
- Name every env key with an uppercase app prefix: `<APP>_BASE_URL`, `<APP>_API_BASE_URL`,
  `<APP>_HEALTH_CHECK_URL`, `<APP>_USERNAME`, `<APP>_PASSWORD`.
- URLs use the server's address as reachable from another machine (e.g. `http://10.0.0.5:8000`), not
  `localhost`.
- Take every route, status code, error message, field name and button label from the real code. Don't guess.
  If you can't confirm something, leave it out and say so in NOTES.md.
- Skip any route that sends email/SMS or has another real-world side effect.
- Never write a test that changes any user's login details (email, password, user id) or deletes a user, not even with a restore step. A save can re-hash the password and lock the test user out.

## Framework contract (fixed, do not change)

The framework's types, which your files must match:

```ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface AppConfig {
  name: string; baseUrl: string; apiBaseUrl: string; healthCheckUrl?: string;   // optional: baseUrl is checked if omitted
  auth: { method: 'none' }   // only if the app has no login
    | { method: 'form'; loginPath: string; username: string; password: string; usernameSelector: string; passwordSelector: string; submitSelector: string };   // logs in once before the tests
  defaultHeaders?: Record<string, string>;
  timeouts?: { test?: number; expect?: number; action?: number };
}
export interface ApiTestCase {
  name: string; method: HttpMethod; url: string;             // url is relative to apiBaseUrl
  headers?: Record<string, string>; query?: Record<string, string | number | boolean>;
  payload?: unknown; expectHttpStatus: number;
  expectBody?: unknown;   // partial match; arrays checked item by item, [] = must be empty; special values: '<any>', '<string>', '<number>', '<boolean>', '<array>', '<object>'
  auth?: boolean;         // set false on every row for now
  save?: Record<string, string>;   // { userId: 'data._id' } saves a response value; use {{userId}} in url/payload/headers of later rows in the same chain
  multipart?: Record<string, string | { file: string; mimeType?: string }>;   // file upload; file path is relative to the app folder
  cleanup?: boolean;      // chains: still runs after an earlier row failed (delete/restore what the chain changed)
  waitMs?: number;        // pause before sending
  skip?: string;          // reason; row is reported as skipped
  sideEffect?: boolean;   // true = skipped by default
}
export interface ApiTestChain { name: string; rows: ApiTestCase[] }   // rows run in order, stop on first failure
export type ApiTestEntry = ApiTestCase | ApiTestChain;
```

Important: if a route answers HTTP 200 even when the action failed (the real result is inside the body), check
both `expectHttpStatus` and `expectBody`.

## Generic examples. Replace <app> and the APP environment prefix for your application.

`.env.example`
```
APP_BASE_URL=http://localhost:5173
APP_API_BASE_URL=http://localhost:8005
APP_HEALTH_CHECK_URL=http://localhost:8005/api/health
APP_USERNAME=
APP_PASSWORD=
```

`app_config.ts`
```ts
import type { AppConfig } from '../../core/types.js';
export const appConfig: AppConfig = {
  name: '<app>',
  baseUrl: process.env.APP_BASE_URL || '',
  apiBaseUrl: process.env.APP_API_BASE_URL || '',
  healthCheckUrl: process.env.APP_HEALTH_CHECK_URL || '',
  auth: { method: 'none' },
  timeouts: { test: 45000, expect: 10000, action: 10000 }
};
```

`api/login.api.ts`
```ts
import type { ApiTestEntry } from '../../../core/types.js';
const username = process.env.APP_USERNAME || '';
const password = process.env.APP_PASSWORD || '';
const login = '/api/auth/login';
export const loginRoutes: ApiTestEntry[] = [
  { name: 'backend health is ok', method: 'GET', url: '/api/health', auth: false, expectHttpStatus: 200, expectBody: { status: 'ok' } },
  { name: 'login - valid user', method: 'POST', url: login, auth: false, payload: { username, password }, expectHttpStatus: 200, expectBody: { success: true } },
  { name: 'login - wrong password', method: 'POST', url: login, auth: false, payload: { username, password: 'wrong-password' }, expectHttpStatus: 401, expectBody: { detail: 'Invalid username or password' } },
  { name: 'login - missing password', method: 'POST', url: login, auth: false, payload: { username }, expectHttpStatus: 422 }
];
```

`api/login.api.spec.ts` (copy as given; for another feature, rename the file and the imported table)
```ts
import { test } from '@playwright/test';
import { runApiEntry } from '../../../core/api_runner.js';
import { loadAppConfig } from '../../../core/config_loader.js';
import { loginRoutes } from './login.api.js';
for (const entry of loginRoutes) test('API: ' + entry.name, async ({ request }) => {
  const config = await loadAppConfig(process.env.TEST_APP!);
  await runApiEntry(entry, config, request);
});
```

`pages/login.page.ts`
```ts
import type { Page } from '@playwright/test';
export class LoginPage {
  constructor(private readonly page: Page) {}
  username = () => this.page.locator('input[name="username"]');
  password = () => this.page.locator('input[name="password"]');
  signInButton = () => this.page.getByRole('button', { name: 'Sign In' });
  open = async () => { await this.page.goto('/login'); };
  signIn = async (username: string, password: string) => {
    await this.username().fill(username);
    await this.password().fill(password);
    await this.signInButton().click();
  };
}
```

`ui/login.ui.spec.ts`
```ts
import { test, expect } from '../../../core/fixtures.js';   // UI specs always import from here
import { LoginPage } from '../pages/login.page.js';
const username = process.env.APP_USERNAME || '';
const password = process.env.APP_PASSWORD || '';
test.use({ storageState: { cookies: [], origins: [] } });   // every login test starts logged out
test.describe('Login', () => {
  test('valid user logs in and reaches the dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.signIn(username, password);
    await expect(page).toHaveURL(/\/dashboard/);
  });
  test('wrong password shows an error and stays on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.signIn(username, 'wrong-password');
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });
  test('empty form shows required messages', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.signInButton().click();
    await expect(page.getByText('Enter your username or email.')).toBeVisible();
  });
});
```

Other screens: tests run on a session that logged in once before the run. Set `auth` in `app_config.ts` to
`{ method: 'form', loginPath, username, password, usernameSelector, passwordSelector, submitSelector }` (values
from `process.env`), and in screen tests just open the screen. Don't sign in again and don't clear `storageState`;
only login and signup tests start logged out, as above.

Prefer stable selectors in this order: `data-testid`/`data-test-subj` â†’ `name` attribute â†’ role + label â†’
placeholder â†’ visible text.

## NOTES.md

Keep it short. Include:

1. Frontend URL, backend URL and health route, as reachable from another machine.
2. How login works: route, request fields, what comes back (token/cookie), where the frontend stores it,
   and whether one user can have only one active session.
3. Anything unusual: HTTP 200 on failure, CSRF or extra required headers, captcha/OTP on login.
4. A table of all other API routes: method, path, needs login (yes/no), changes data (yes/no), side effect
   (email etc.). These will be tested later.
5. What a test user needs (role, active status), and anything you couldn't confirm from the code.

When done, show me the folder's file list and NOTES.md.

