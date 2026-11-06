# Portable Testing Framework

A reusable Playwright framework for UI and HTTP API checks. The shared engine lives in `core/`; each application's URLs, authentication, data hooks, and test cases live in `apps/<name>/`.

For publishing `udaynasya/test_tool` from GitHub Actions and running it with reports saved
on server disk, see [Docker setup](documents/docker_setup.md).

## Install

Requires Node.js 20 or newer. From this directory:

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
npm run typecheck
```

Each app keeps its URLs and credentials in `apps/<app>/.env`; the root `.env` holds shared settings such as `SLOW_MO`. Keep `.env` private; it is ignored by Git.

PCB / DRP E2E setup and its authored case inventory are documented in [apps/pcb/README.md](apps/pcb/README.md). That integration contains E2E specs only.

## Run

```powershell
npm test <app>
npm test <app> <file>        # only matching test files
npm run test:api -- <app>
npm run test:ui -- <app>
npm run test:e2e -- <app>
npm run test:headed -- <app>
npm run test:debug -- <app>
npm run report -- <app> --ui   # or --api / --e2e
npm run allure -- <app> --ui   # or --api / --e2e
```

Replace `<app>` with the application's folder name under `apps/`; do not type the angle brackets. `npm test <app>` runs available API, UI and E2E suites sequentially as separate Playwright runs. Each suite has its own setup, teardown and reports. Apps must already be running unless their app config defines a `startCommand`. Unknown or missing app names print the available app folders. Combine a mode with browser options, for example `npm run test:ui -- <app> --headed`.

Reports are separated by test type and then application:

```text
reports/
  api_report/<app>/
  ui_report/<app>/
  e2e_report/<app>/
```

Each contains its own `html/`, `artifacts/`, `allure-results/`, `allure-report/` and dated shareable HTML report. Authentication state is isolated in that same folder. API row results are saved as `api_results.jsonl` and `api_results.json` in the API folder (or E2E folder when an E2E spec uses the shared API runner). UI-only runs do not create an empty API summary.

A run replaces generated outputs only for its selected type and app; UI runs leave API and E2E reports intact. Existing legacy files under `reports/<app>/` remain unchanged and are not used for new runs. `report` and `allure` commands require a report type to avoid opening the wrong results.

E2E specs belong in `apps/<app>/e2e/*.e2e.spec.ts`. E2E means UI actions verified against real API requests/responses in the same flow; combining separate API and UI suites does not make them E2E. Keep application-specific coverage, account requirements and execution limits in that application's documentation under `apps/<app>/`. An explicitly selected suite with no spec files exits with a clear error before replacing reports.

## Add an application

1. Create `apps/<new_name>/` with `app_config.ts`, and optionally `hooks.ts`, `api/`, `ui/`, `e2e/`, `pages/`, `data/`.
2. Create `apps/<new_name>/.env.example` with empty or sample values for `<APP>_BASE_URL`, `<APP>_API_BASE_URL`, `<APP>_HEALTH_CHECK_URL`, and any required credentials. Replace `<APP>` with your application's uppercase environment prefix. Copy it to a private `.env` and fill in the actual values.
3. Set `name` to the new folder name, then set those environment variables, auth method, selectors, optional headers/timeouts, and an optional `startCommand` in `app_config.ts`. Never put a password in source control.
4. Put app-specific test-data setup and cleanup in `hooks.ts` (`loadTestData` and `cleanupTestData`). Both may be empty async functions.
5. Add tests using the naming `api/<feature>.api.ts` + `api/<feature>.api.spec.ts`, `ui/<feature>.ui.spec.ts`, `e2e/<feature>.e2e.spec.ts`, `pages/<screen>.page.ts`. Add JSON data under `data/` as needed.
6. Run `npm test <new_name>` and inspect its report.

The core does not contain application URLs, routes, labels, or headers. `app_config.ts` is the interface between the shared runner and an application.

## API rows

An API row has a name, method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), relative URL, and `expectHttpStatus`. Optional fields are `headers`, `query`, `payload`, `expectBody`, `auth: false`, `saveAs`, `skip`, `sideEffect`, and `timeout`. Body expectations recursively match the specified object properties; use `{{id}}` to substitute values captured by a prior chain row. `saveAs: 'id'` captures a response `id` (or `data.id`). Rows with `skip` or `sideEffect` are reported as skipped; real side effects are skipped by default.

Independent entries are separate report tests. A chain is an ordered `rows` list: when a row fails, remaining operations in that chain stop, avoiding unintended follow-up changes. API results include request, status, response body, error, duration, and outcome.

## Login methods

- `none`: no saved login session.
- `form`: opens the configured login screen, fills selectors, and saves browser cookies/storage for UI and authenticated API tests.
- `token`: posts credentials, reads the token at `tokenPath`, and applies it as a browser header and local storage value. Set `headerName` and `prefix` to match the application.

For login-screen UI tests, navigate to the login screen explicitly; the general UI project starts with the saved session. `auth: false` API rows run without saved cookies. Test data cleanup is a Playwright teardown project so it runs after test failures.
