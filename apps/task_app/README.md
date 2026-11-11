# Task App test cases

These specs target the separately hosted React Task App. No local app is started
by this configuration. No test execution is part of adding these files.

Configure the user-provided live URLs in `apps/task_app/.env` (see `.env.example`):

- `TASK_APP_BASE_URL`: live browser URL, required.
- `TASK_APP_API_BASE_URL`: API origin, optional when the browser URL serves `/api`.

Coverage: API health, API task CRUD, invalid title validation, UI task workflow,
and E2E persistence verified through the API and browser reload.

Tests create uniquely named tasks and remove their own records. They do not
clear existing application data. Backend routes must follow the Task App API.
