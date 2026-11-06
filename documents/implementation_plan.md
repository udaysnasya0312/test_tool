# Testing Framework: Implementation Plan

Status: PLAN (nothing installed or built yet)
Date: 2026-10-01
Based on: `testing framework.txt` (the proposal)
Location: `D:\Nasya Projects\Testing_Framework`


## 1. What this plan covers

This plan builds the test framework itself, and only that. The framework is finished and proven before any
real application is connected to it.

The framework does not care what an application is built with. It needs two things from any application:
a URL to open in a browser, and HTTP endpoints to call. Everything else is configuration.

In this plan:
- The project skeleton, the core engine, the run command and the report.
- A small sample target that ships with the framework, used to prove the engine works.
- The template and instructions for adding a real application later.

Not in this plan:
- Tests for any real application. That starts after this plan is complete (section 8).
- Git or GitHub setup. The framework stays a plain folder for now.
- Automatic runs from a build server (CI).
- Performance, load and security testing.
- Browsers other than Chromium.


## 2. Changes from the proposal

The proposal was written for a Linux machine. Three things change for this setup.

| Proposal                         | This plan                               | Reason                                          |
|----------------------------------|-----------------------------------------|-------------------------------------------------|
| `/home/ubuntu/testing_framework` | `D:\Nasya Projects\Testing_Framework`   | Local Windows machine                           |
| `./run_tests.sh <app_name>`      | `npm test <app_name>`                   | A shell script does not run natively on Windows; an npm command runs the same on Windows and Linux |
| Its own git repo, `.gitignore`   | No git for now                          | Decided; can be added later with no rework      |

One addition: a sample target (section 4.3). Without it there is no way to check that the engine works
until a real application is connected, and any failure would then be hard to place: framework or app.


## 3. Prerequisites

| Item        | Needed            | On this machine                    |
|-------------|-------------------|------------------------------------|
| Node.js     | 20 or newer       | v20.12.2, already installed        |
| npm         | comes with Node   | 10.9.2, already installed          |
| Chromium    | Playwright's copy | installed in Phase 1               |
| Disk space  | about 500 MB      | browser download plus node_modules |

Packages to install, all as dev dependencies, versions pinned at install time:

| Package            | Purpose                                             |
|--------------------|-----------------------------------------------------|
| `@playwright/test` | Test runner, browser control, API client, reports   |
| `typescript`       | Type checking of the framework and the tests        |
| `@types/node`      | Types for Node's built-in modules                   |
| `dotenv`           | Reads URLs and login details from the `.env` file   |

No other packages are planned. The sample target uses only Node's built-in modules.


## 4. Target structure

```
Testing_Framework/
  documents/                       the proposal and this plan
  package.json                     project name, pinned versions, the run commands
  tsconfig.json                    TypeScript settings
  playwright.config.ts             builds the run from the selected app's config
  run_tests.mjs                    the entry point behind `npm test <app_name>`
  .env.example                     template for URLs and login details
  .env                             the real values (local only, never shared)
  README.md                        how to run, how to add a new app

  core/                            reusable engine, same for every app
    types.ts                       shared definitions
    config_loader.ts               finds and validates the selected app's config
    health_check.ts                checks the target is up before anything runs
    login.ts                       signs in once and saves the session
    api_runner.ts                  runs API tables and records every result
    data_setup.ts                  loads and cleans up test data
    reporting.ts                   attaches results to the report, writes the API summary
    global_setup.ts                run-level start: health check
    session.setup.ts               data load and login, runs before the tests
    session.teardown.ts            data cleanup, runs after the tests

  apps/
    sample/                        the sample target's tests; also the template to copy
      app_config.ts
      hooks.ts                     how this app loads and cleans its test data
      pages/
      api/
      ui/
      data/

  sample_app/
    server.mjs                     the small sample target itself

  reports/
    <app_name>/                    generated on every run
```

### 4.1 The rule that keeps it reusable

`core/` never contains an application's name, URL, route, field label or header. `apps/<app_name>/` contains
only that application's facts. If a core file needs to know something about an application, that thing
becomes a field in the app config.

### 4.2 What an app config holds

`apps/<app_name>/app_config.ts` is the only place the framework learns about an application.

| Field            | Meaning                                                              |
|------------------|----------------------------------------------------------------------|
| `name`           | The app's folder name                                                |
| `baseUrl`        | Address the browser opens                                            |
| `apiBaseUrl`     | Address API calls go to; may be the same as `baseUrl`                |
| `healthCheckUrl` | Address that answers when the app is up                              |
| `auth`           | How to sign in: one of the three methods in section 5.3              |
| `defaultHeaders` | Headers every API call needs, if any                                 |
| `timeouts`       | Overrides for slow applications, optional                            |
| `startCommand`   | Optional; lets the framework start the target itself (sample only)   |

URLs and login details come from `.env`, named per app, for example `SAMPLE_BASE_URL`, `SAMPLE_USERNAME`.
The config file reads them; it never holds a password itself.

### 4.3 The sample target

`sample_app/server.mjs` is one small file, started automatically when the sample app is selected. It
provides just enough to exercise every part of the engine:

- a health address,
- a login page and a home page,
- a login route, including one that answers HTTP 200 with a failure inside the body,
- create, read, update and delete routes for one simple record type,
- a route that requires being signed in.

Its tests in `apps/sample/` double as the worked example that a real application's folder is copied from.


## 5. How the pieces work

### 5.1 The run, start to finish

```
npm test <app_name>
  1. run_tests.mjs       checks apps/<app_name> exists; if not, lists the apps that do and stops
  2. config_loader       reads app_config.ts and .env; stops with a clear message if a value is missing
  3. health check        calls healthCheckUrl; stops with a clear message if the app is not reachable
  4. data load           runs the app's own load step
  5. login               signs in once, saves the session for every test to reuse
  6. API tests           every row of every table
  7. UI tests            every flow, in Chromium
  8. data cleanup        runs the app's own cleanup step, even when tests failed
  9. report              one HTML report, plus a summary file of every API call
```

Steps 3 to 8 are one Playwright run, so they land in one report. Steps 4, 5 and 8 run as Playwright's own
setup and teardown stages, which means a failure there shows up in the report like any other failure.

### 5.2 API tests

Each route is one row in a table. The row type, defined once in `core/types.ts`:

| Field              | Required | Meaning                                                         |
|--------------------|----------|-----------------------------------------------------------------|
| `name`             | yes      | What the row checks; becomes the line in the report             |
| `method`           | yes      | GET, POST, PUT, PATCH or DELETE                                 |
| `url`              | yes      | Path, relative to `apiBaseUrl`                                  |
| `headers`          | no       | Added to the app's default headers                              |
| `query`            | no       | Query string values                                             |
| `payload`          | no       | Request body                                                    |
| `expectHttpStatus` | yes      | The status code that counts as a pass                           |
| `expectBody`       | no       | Values the response body must contain                           |
| `auth`             | no       | Set to false to send the call without the saved session         |
| `saveAs`           | no       | Keeps a value from the response for later rows                  |
| `skip`             | no       | A reason; the row is reported as skipped, not run               |
| `sideEffect`       | no       | Marks a route that does something real; skipped by default      |

Two kinds of table:

- **Independent rows.** Each row is its own test and can pass or fail alone.
- **Chains.** An ordered list of rows that share values. A create row saves the new record's id with
  `saveAs`, and the read, update and delete rows that follow use it as `{{id}}`. If one row fails, the
  rest of that chain is skipped and reported as such. This is how a run cleans up after itself.

For every row the runner records the status code, the full response body, the error message when there is
one, the time taken, and pass or fail. All of it is attached to that row's entry in the HTML report and
written to `reports/<app_name>/api_results.json`.

A response that is not valid JSON, a timeout and a refused connection are each recorded as a failure with
the real message. They never crash the run.

### 5.3 Login

The engine supports three ways to sign in. The app config picks one.

| Method  | How it works                                                        | Used when                          |
|---------|---------------------------------------------------------------------|------------------------------------|
| `none`  | Nothing happens                                                     | The app has no login               |
| `form`  | Opens the login screen in the browser, fills it in, saves the browser session | The session is kept by the browser (cookies or browser storage) |
| `token` | Calls the login route, reads the token from the response, sends it on every API call and places it in the browser | The app uses a token in a header |

Login happens once per run. Every test starts already signed in. Tests of the login screen itself start
signed out.

### 5.4 UI tests

Standard Playwright tests, one file per screen or feature, as the proposal describes. Screen helpers in
`pages/` hold where the fields and buttons are. The engine adds nothing on top except the saved session
and the report settings, so anything in Playwright's own documentation applies as written.

### 5.5 Test data

The engine cannot know how a given application stores data, so each app supplies two functions in
`hooks.ts`: one to load its test data and one to remove it. `core/data_setup.ts` calls them at the right
moment and makes sure cleanup runs even after failures. An app with nothing to load leaves both empty.

### 5.6 Report

Everything goes under `reports/<app_name>/`:

| Output              | Contents                                                             |
|---------------------|----------------------------------------------------------------------|
| `html/`             | The Playwright report: pass, fail and skipped for every test         |
| `artifacts/`        | Screenshots, videos and traces                                       |
| `api_results.json`  | Every API call: status, body, error, time, pass or fail              |

Screenshots, videos and traces are kept for failed tests only, which keeps the folder small. Each run
replaces the previous run's output for that app.

### 5.7 Commands

| Command                       | What it does                                           |
|-------------------------------|--------------------------------------------------------|
| `npm test <app_name>`         | Full run: API then UI, one report                      |
| `npm run test:api <app_name>` | API tests only                                         |
| `npm run test:ui <app_name>`  | UI tests only                                          |
| `npm run test:headed <app_name>` | Full run with the browser window visible            |
| `npm run test:debug <app_name>`  | Opens Playwright's timeline view to step through tests |
| `npm run report <app_name>`   | Opens the last report for that app                     |
| `npm run typecheck`           | Checks the TypeScript without running anything         |


## 6. Build phases

Each phase ends with a check that can be run and seen. A phase is not finished until its check passes.

### Phase 1: Project skeleton

Build:
- `package.json` with the four packages and the commands from section 5.7.
- `tsconfig.json`, including support for importing `.json` data files.
- Install the packages and Playwright's Chromium.
- `.env.example`, and the empty `core/`, `apps/`, `reports/` folders.
- `run_tests.mjs` with app name checking.

Done when:
- `npm run typecheck` passes.
- `npm test` with no app name, and with a name that does not exist, each stop with a clear message that
  lists the available apps.

### Phase 2: Contracts and the sample target

Build:
- `core/types.ts`: the app config shape, the API row and chain shapes, the result shape.
- `core/config_loader.ts`: loads the selected app's config, reads `.env`, reports any missing value by name.
- `sample_app/server.mjs` with the routes listed in section 4.3.
- `apps/sample/app_config.ts`.
- `playwright.config.ts`, built from the loaded app config.

Done when:
- The sample target starts by itself on `npm test sample` and stops when the run ends.
- Removing a required value from `.env` produces a message naming that value.

### Phase 3: Health check

Build:
- `core/health_check.ts` and `core/global_setup.ts`.

Done when:
- With the target up, the run continues.
- With the target down, the run stops before any test, and the message gives the address that was tried
  and what came back.

### Phase 4: API runner

Build:
- `core/api_runner.ts`: independent rows, chains, `saveAs` and `{{value}}` substitution, body matching,
  `skip` and `sideEffect` handling.
- `apps/sample/api/`: one table of independent rows, one create-read-update-delete chain, and `api.spec.ts`.

Done when, against the sample target:
- A passing row, a wrong-status row and a wrong-body row each report correctly.
- The row that returns HTTP 200 with a failure in the body is caught by its body check.
- The chain creates a record and removes it, leaving the target as it started.
- A row marked `sideEffect` is reported as skipped.
- A deliberately broken row shows the status, body and error in the report.

### Phase 5: Login and session

Build:
- `core/login.ts` with the `none`, `form` and `token` methods.
- `core/session.setup.ts`.
- `apps/sample/pages/login_page.ts`.

Done when:
- A signed-in route passes in the API tests without the table doing anything about login.
- A row with `auth: false` on that same route is rejected, as expected.
- A UI test opens the home page directly and is already signed in.
- Both the `form` and `token` methods work against the sample target.

### Phase 6: UI tests

Build:
- `apps/sample/ui/login.spec.ts` and one feature flow, with their screen helpers.
- Screenshot, video and trace settings in `playwright.config.ts`.

Done when:
- The login flow passes for a valid user and fails correctly for a wrong password.
- A deliberately broken test produces a screenshot, a video and a trace that replays.
- `test:headed` and `test:debug` both work.

### Phase 7: Test data

Build:
- `core/data_setup.ts` and `core/session.teardown.ts`.
- `apps/sample/hooks.ts` and `apps/sample/data/`.

Done when:
- Sample data is present during the run and gone after it.
- Cleanup still runs when a test fails partway.
- Two runs back to back give the same result.

### Phase 8: Reporting

Build:
- `core/reporting.ts`: attaches each API result to its report entry, writes `api_results.json`.
- The console summary at the end of a run: counts, and where the report is.

Done when:
- One run produces one HTML report covering both API and UI tests.
- Every API row in the report opens to show its status, body and error.
- `npm run report sample` opens it.

### Phase 9: Template and instructions

Build:
- `README.md`: install, run, read the report, add an application, the row fields, the three login methods.
- A final pass over `apps/sample/` so it reads as a clean example to copy.

Done when:
- Following only the README, copying `apps/sample/` to a new name and pointing it at the sample target
  gives a passing run with no change to `core/`.


## 7. Points to settle during the build

| Point | Plan | Fallback |
|-------|------|----------|
| API tests must finish before UI tests in the same run | Set up as two Playwright projects and confirm the order in Phase 6 | Run the two in sequence and merge them into one report, which Playwright supports |
| Passing the app name through `npm test <app_name>` on Windows | Confirm in Phase 1 | `node run_tests.mjs <app_name>` as the documented command |
| The folder path contains a space (`Nasya Projects`) | `run_tests.mjs` starts Playwright directly, not through a shell string | None needed if confirmed in Phase 1 |
| Run time as tests grow | One test at a time to start, for predictable results | Turn on parallel runs per app once its tests are known to be independent |


## 8. After the framework is built

Connecting a real application is a separate piece of work. It needs these from the application, whatever
it is built with:

1. The address of its screens and the address of its API.
2. An address that shows it is up.
3. How it signs users in, so one of the three login methods can be picked.
4. A test user that is safe to use.
5. Which routes do something real (send email, charge, notify), so they are marked and skipped.
6. How test data can be loaded and removed without touching real data.

With those, the work is: copy `apps/sample/`, fill in the config, write the first login flow and a first
API table, check the report, then grow coverage from the most important flows outward.


## 9. Order of work

```
Phase 1  skeleton
Phase 2  contracts + sample target
Phase 3  health check
Phase 4  API runner
Phase 5  login and session
Phase 6  UI tests
Phase 7  test data
Phase 8  reporting
Phase 9  template and instructions
-------  framework complete
Next     first real application (section 8)
```

Phases run in this order because each one is checked using what the one before it built.
