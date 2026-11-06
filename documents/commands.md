# Testing Framework: Commands

Run commands from the framework root, where `package.json` lives. Replace `<app>` with the application's folder name under `apps/`, `<file>` with a file-name filter, and `<APP>` with the application's environment-variable prefix. Do not type the angle brackets.

## Setup

```powershell
npm install
npx playwright install chromium
npm run typecheck
```

Keep shared settings in the root `.env`. Keep application URLs and credentials in `apps/<app>/.env`, using that application's `.env.example` as the template.

## Run suites

| Command | What it runs |
|---|---|
| `npm test -- <app>` | Available API, UI and E2E suites sequentially, with separate reports |
| `npm run test:api -- <app>` | API suite |
| `npm run test:ui -- <app>` | UI suite |
| `npm run test:e2e -- <app>` | E2E suite |
| `npm run test:ui -- <app> --headed` | UI suite with a visible browser |
| `npm run test:e2e -- <app> --headed` | E2E suite with a visible browser |
| `npm run test:headed -- <app>` | Available suites with a visible browser |
| `npm run test:debug -- <app>` | Available suites in Playwright debug mode |

API setup may still launch a browser to prepare authentication, depending on the application's configuration. An explicitly selected suite with no spec files exits before replacing reports.

## Filter test files

```powershell
npm run test:api -- <app> <feature>.api
npm run test:ui -- <app> <feature>.ui
npm run test:e2e -- <app> <feature>.e2e
npm run test:ui -- <app> <feature>.ui --headed
npm run test:e2e -- <app> <feature>.e2e --debug
```

Choose a suite when filtering files to avoid launching unrelated suites with no matching tests. One suite selector (`--api`, `--ui` or `--e2e`) can be combined with browser options such as `--headed` or `--debug`.

Each suite runs its own setup and teardown. General browser tests start with the saved session; application fixtures can select another account or start logged out. UI tests importing `core/fixtures.ts` hold the screen briefly at the end of a headed test according to `HOLD_SCREEN_MS`.

## Open reports

| Command | What it opens |
|---|---|
| `npm run report -- <app> --api` | API Playwright HTML report |
| `npm run report -- <app> --ui` | UI Playwright HTML report |
| `npm run report -- <app> --e2e` | E2E Playwright HTML report |
| `npm run allure -- <app> --api` | API Allure report |
| `npm run allure -- <app> --ui` | UI Allure report |
| `npm run allure -- <app> --e2e` | E2E Allure report |
| `npx playwright show-trace "<trace-path>"` | A recorded trace ZIP |

```text
reports/
  api_report/<app>/
  ui_report/<app>/
  e2e_report/<app>/
```

Each category contains `html/`, `artifacts/`, `allure-results/`, `allure-report/` and its dated shareable HTML report. Saved authentication state stays within the same category. A run replaces generated outputs only for the selected category and application. Legacy `reports/<app>/` outputs are preserved and no longer updated.

API row records appear in `api_results.jsonl` and `api_results.json` in the API report folder. E2E cases using the shared API runner put row records in the E2E folder; cases observing browser traffic may attach exchanges directly to individual test results instead. UI-only runs do not create an empty API summary.

Skipped-test reasons appear in the console and in the HTML report. For API row records, inspect the `error` field of rows with `outcome: "skipped"`.

## Share results

Use the dated, self-contained HTML file in the relevant report folder for Allure results. For the Playwright report, archive the entire `html` folder so its attachments stay together:

```powershell
Compress-Archive -Path "reports/ui_report/<app>/html" -DestinationPath "<app>-ui-report.zip" -Force
```

Replace `ui_report` with `api_report` or `e2e_report` as needed. After extraction, open the HTML report folder with `npx playwright show-report "<extracted-html-folder>"`. Review recorded requests and attachments for sensitive data before sharing.

When reporting a failure, include its test name, actual error, and whether investigation points to an application issue or a test expectation/selector issue. Keep application findings in `apps/<app>/NOTES.md` or that application's documentation.

## Settings

| File | Setting | Meaning |
|---|---|---|
| Root `.env` | `SLOW_MO=1000` | Delay between steps in headed mode, in milliseconds |
| Root `.env` | `HOLD_SCREEN_MS=3000` | Screen hold for headed tests using the shared UI fixture |
| Root `.env` | `HEALTH_WAIT_SECONDS=30` | Health-check retry period |
| `apps/<app>/.env` | `<APP>_BASE_URL` | Frontend URL |
| `apps/<app>/.env` | `<APP>_API_BASE_URL` | API URL |
| `apps/<app>/.env` | `<APP>_HEALTH_CHECK_URL` | Optional health URL; frontend URL is used if omitted |
| `apps/<app>/.env` | Account variables defined by the app config/fixtures | Test account credentials |

Keep `.env` files private. Environment variable names and account selection are defined by the application's configuration and fixtures.

## Add an application

1. Create `apps/<app>/app_config.ts` and a matching `.env.example`.
2. Copy the template to a private `.env` and configure URLs and authentication.
3. Add optional `hooks.ts` for test-data setup and cleanup.
4. Add specs and page objects using the patterns below.
5. Run the appropriate suite and inspect its report.

| Folder | Pattern | Purpose |
|---|---|---|
| `api/` | `<feature>.api.ts` | API case declarations |
| `api/` | `<feature>.api.spec.ts` | Executes API cases |
| `ui/` | `<feature>.ui.spec.ts` | UI behavior checks |
| `e2e/` | `<feature>.e2e.spec.ts` | UI actions verified against real API traffic and rendered results |
| `pages/` | `<screen>.page.ts` | Reusable screen selectors and actions |

See `agent_prompt_new_app.md` for integration guidance. Keep account requirements, coverage counts and application-specific instructions in the application's own folder.

## Common errors

| Message | Meaning / next step |
|---|---|
| `Health check failed` | Check the configured URL, application server and network access |
| `Unknown app` | Check `apps/<app>/app_config.ts` and the folder name |
| `Choose the report type` | Add `--api`, `--ui` or `--e2e` to the report-opening command |
| `No ... spec files found` | Add specs under the selected suite folder or choose an existing suite |
| `strict mode violation` | Scope the locator so it identifies one intended element |
| `Expected ... Received ...` | Compare the expectation with the actual UI/API result before classifying it as an application bug |
