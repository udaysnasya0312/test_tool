# EET — test notes

EET is a Kibana plugin (`eetUi`). The frontend and the API are served by the same Kibana server.

## 1. URLs

| What | URL |
|---|---|
| Frontend | `http://172.31.45.135:5601/app/eetUi` (login screen: `/app/eetUi/login`) |
| Backend API | `http://172.31.45.135:5601` (same server) |
| Health | `GET /api/status` → 200, `status.overall.level = "available"` (no login needed) |

`172.31.45.135` is the server's private IP. Use it only if the test machine is on the same network. If not, replace it with the public IP or hostname.

## 2. How login works

- Route: `POST /login` with body `{ "email": string, "password": string }`. Both fields are required.
- The server looks for a document in the Elasticsearch `user` index whose email and password match. The password is stored and compared as **plain text**.
- On success it returns `{ status: 200, message: "User Login Successfully!", data: <user document> }`. No token or cookie is issued.
- The frontend stores `data` in `localStorage.user`, sets `localStorage.isUserLogin = "true"`, and goes to `/app/eetUi/`. That is the only "session". Nothing is enforced on the server, so one user can be logged in any number of times.
- **Kibana session comes first.** Every API call (login included) needs Kibana's `sid` cookie. Kibana uses an *anonymous* provider (`config/kibana.yml`). It creates the cookie only on a normal page load, meaning a GET of `/app/eetUi` **without** a `kbn-xsrf` header. With no cookie, the API returns **401 Unauthorized**. That is why each API login test is a chain that opens the page first.

## 3. Unusual things

- **HTTP 200 on failure:** a wrong password or unknown email returns HTTP 200 with `{ status: 400, message: "User Not Exists!" }`. The tests check the body too.
- **`kbn-xsrf` header:** every POST/PUT/DELETE must send `kbn-xsrf: true`, or Kibana returns 400. Do **not** send it on the page GET, or no session is created. This is why it is set per row, not in `defaultHeaders`.
- **Missing field:** returns a real HTTP 400 from Kibana schema validation.
- **UI messages are toasts:** success and failure both show as toasts. The failure message ("User Not Exists!") is shown as a green *success* toast (an app bug). An invalid or empty email shows a red "Invalid Email!" toast. There is no inline required-field text.
- **No captcha, no OTP on login.** Signup does use an email OTP.
- **Security concern:** the login response returns the user's plain-text password inside `data._source`.
- **Selectors:** the login form has no `data-test-subj` or `name` attributes. The tests use the placeholders (`E-mail`, `Password`) and the button label `Login` (English UI, the default language).

## 4. Other API routes (for later)

All routes need the Kibana session cookie. None of them check the EET user or role on the server, so "needs login" below means only the Kibana session.

| Method | Path | Changes data | Side effect |
|---|---|---|---|
| POST | /signup | no | **sends OTP email** |
| POST | /verifyotp | yes (creates user) | — |
| POST | /profile | no | — |
| POST | /updateProfile | yes | — |
| POST | /users/list | no | — |
| POST | /users | yes (creates user, password `123456`) | **sends password email** |
| PUT | /users | yes | — |
| DELETE | /users | yes | — |
| GET | /dashboardCount | no | — |
| POST | /api/eet_ui/contact | yes | **sends emails to user + admin** |
| POST | /api/eet_ui/contact-requests | no | — |
| PUT / DELETE | /api/eet_ui/contact-requests/{id} | yes | — |
| POST | /api/track-visit | yes | — |
| POST | /api/read-track-visits, /api/read-system-usages, /api/reportData, /api/getcountryonregions | no | — |
| GET | /api/eet_ui/example, /api/main_dashboard/example, /api/new_dashboard/example, /api/eet/example | no | — |
| POST | /api/eet/timeseries-data | no | — |
| POST | /api/indicatorOverview, /api/getCountryComparison, /api/getCorrelationHeatmap, /api/getRegionalFlow, /api/getLatestCountryRecords, /api/getYearlyGrowth, /api/getDetailedMetrics | no | — |
| POST | /api/eet_ui/dashboard/* (cards, average, average_over_time, distribution, top_indicators, regional_performance, top_indicator_donut, data_availability, top_countries, trend_summary, indicator_table, global_coverage, globe) | no | — |
| GET | /getcountry, /getchart, /getregion | no | — |
| POST | /getchart, /getindicators, /getindicatorname, /getcountryonregion, /checkcountry, /chart, /mapregiontoindicator, /getAllBubble, /getValidYearsForIndicators, /getValidRegionsForIndicators, /getValidYearsForIndicatorsList | no | — |
| GET | /newDashboard/getcountry, /newDashboard/getchart, /newDashboard/getindicators, /newDashboard/getregion | no | — |
| POST | /newDashboard/getchart, /newDashboard/getindicatorname, /newDashboard/getcountryonregion, /newDashboard/checkcountry, /newDashboard/chart, /newDashboard/mapregiontoindicator, /newDashboard/getAllBubble | no | — |
| POST | /api/newDashboard/saveWishlist, /api/newDashboard/saveDashboardGraphs | yes | — |
| POST | /api/newDashboard/getWishlist, /api/newDashboard/getDashboardGraphs | no | — |
| POST | /api/exam/questions, /api/exam/list, /api/exam/all/list | no | — |
| GET | /api/exam/view/{id} | no | — |
| POST | /api/exam/save | yes | — |
| DELETE | /api/exam/delete | yes | — |
| POST | /api/saveDashboard | yes | — |
| PUT | /api/updateDashboard | yes | — |
| DELETE | /api/deleteDashboard | yes | — |
| POST | /api/readDashboard, /api/readAllDashboard, /api/readDashboard/id | no | — |
| POST | /api/getAllIndicators, /api/getIndicatorById, /api/getIndicator/category, /api/questions/title, /api/questions, /api/all/questions, /api/questions/ById | no | — |
| POST | /api/insert/questions | yes | — |
| POST | /api/deleteById | yes (delete-by-query on indicators) | — |
| DELETE | /api/questions | yes (delete-by-query) | — |

## 5. Test user

- The user must be a document in the `user` index with `email` and plain `password`. `role` (`user` / `admin` / `superadmin`) only matters for which menus the frontend shows, not for login.
- No "active" or "disabled" status exists in the code.
- Verified live on 2026-10-07 against the running server: health, all API login rows, and the 401/400 responses match the tests above.
- Not confirmed: whether the test machine can reach `172.31.45.135:5601` (network or firewall).
- Not run yet: the browser tests (`ui/login.ui.spec.ts`). The app server is missing the system libraries a browser needs. The selectors and messages come from `public/components/auth/Login.tsx` and `public/translations/en.json`.

## Part 2, step 2: detailed screen tests

- Done for `/eet` + `/corelate`, `/analytics`, `/dashboard-template-1` and signup, each in its own `ui/<screen>.ui.spec.ts` and `pages/<screen>.page.ts`.
  - `/eet`: default bubble graph and filters, year change, clear filters, country picker, graph settings, delete graph, chart launcher add/remove and search, save-graph form checks (not submitted), wishlist (logged out, so nothing is saved), correlation source picker and back button.
  - `/analytics`: all seven cards load, Apply, Clear, indicator change, country removal, region change.
  - `/dashboard-template-1`: default load, indicator change, region change, country removal, Clear Filters.
  - Signup: empty form, invalid email, passwords differ, terms not accepted, already registered email (refused before any mail), login link. No case reaches the OTP step.
- Charts are checked through the request each screen sends (`POST /chart`, `/api/...`), not the drawn chart. Only bubble charts are loaded on `/eet` (see the `/chart` bug).
- Other screens still have only the "opens cleanly" test.
- Not run yet (no browser on the server).

## Part 3: write API tests

Files: `api/dashboards_write.api.ts`, `api/exam_write.api.ts`, `api/contact_write.api.ts`, each with its `.api.spec.ts`.

- Agreed with the user on 2026-10-08: writing to the real Elasticsearch is OK; use the `.env` user; **never delete an indicator or any record the tests did not create**.
- Each chain only deletes the `TEST_<what>_<run id>` record it made, or reads the current values first and writes them back at the end.

| Chain | Steps | Cleanup |
|---|---|---|
| saved dashboard | save → find by name → same name refused (400) → read by id → update → read → delete → gone | deletes its own TEST_ dashboard |
| main dashboard graph layout | read current → save TEST_ layout → read back → put original back | original restored |
| exam result | save → find in list (waits 2 s; save is not refreshed) → view → delete → gone | deletes its own TEST_ exam |
| contact request | save the newest request's status with its own value | nothing changes except `updatedAt` |
| contact request bad input | bad status, email, subject, short message, no fields (fake id) | stops before any write |

Not tested, on purpose:
- `/api/deleteById`, `DELETE /api/questions`, `/mapregiontoindicator`: delete or rewrite real data.
- `PUT /users`, `/updateProfile`: removed on 2026-10-09. Saving the profile re-hashes the password (argon2) while login compares plain text, which locked the test user out. No tests may change a user.
- `DELETE /users`: would delete the `.env` user. `DELETE /api/eet_ui/contact-requests/{id}`: would delete a real request (tests can't create one).
- `POST /users`, a successful `/signup`, `/api/eet_ui/contact`: send email. `/verifyotp` needs the emailed OTP.
- `/api/insert/questions`, `/api/track-visit`: no routed screen calls them.

Findings from the code (these steps fail until fixed):
- `PUT /api/updateDashboard` replaces the whole record, so `user_id`, `description` and `createdAt` are lost and the dashboard drops out of the owner's list ("update keeps the owner" step).
- The `/exam` screen autosaves every 20 s with `{ currentQuestion, timeLeft, userAnswers }`; `/api/exam/save` rejects it with 400, so the autosave never saves ("bad input - exam autosave payload" row).

What `core/` (not built yet) must support for these files:
- `{{name}}` in url and payload; a payload value that is exactly `'{{name}}'` is replaced by the saved value as-is (object or array).
- `save: { name: 'path.in.body' }`; a missing path saves `''` (the test user has no gender/dob/country).
- `expectBody`: objects match partially; an expected array matches item by item, and `[]` means empty.
- `waitMs` on a row: wait before sending it.
- `cleanup: true` on a row: run it even when an earlier row in the chain failed.

Not run yet.
