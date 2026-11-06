# GitHub Actions to Docker Hub demo setup

Image repository: `udaynasya/test_tool`.

The image contains the framework at the GitHub workflow's commit. Publishing an
image does not run application tests. To use updated tests, publish a new image.

## One-time GitHub setup

1. In Docker Hub, create a personal access token with Read and Write permissions.
2. In your GitHub repository, open **Settings > Secrets and variables > Actions**.
   Configure the `dev` environment under **Settings > Environments**, and add
   each secret below to that environment. The publish job uses `environment: dev`.

   | Key | Value |
   | --- | --- |
   | `DOCKERHUB_USERNAME` | `udaynasya` |
   | `DOCKERHUB_TOKEN` | Your Docker Hub access token |

   Repository secrets with the same names also work if no environment secret
   overrides them. Use the newly generated token, replacing the one previously exposed in a
   screenshot. GitLab variables do not transfer to GitHub. Do not put the token
   in `.env` or tracked files.
3. Ensure GitHub Actions is enabled for the repository. The workflow uses a
   GitHub-hosted Ubuntu runner with Docker already available.
4. Commit and push the Docker files and `.github/workflows/docker-publish.yml`
   to the default branch (usually `main`).
5. Open **Actions > Build and publish Docker image > Run workflow**. Select the
   default branch and click **Run workflow**. Publishing is restricted to that
   branch; runs selected on other branches are skipped.

The job builds the image, checks Chromium launches, and pushes two tags:
`udaynasya/test_tool:<full-commit-sha>` and `udaynasya/test_tool:latest`.
Use the commit tag for repeatable demo executions. No automatic test trigger is
configured.

This workflow runs manually only. Pushing code does not build images or run
application tests. A local Docker installation is not required for this build.

## Run on the demo server (Linux)

Install Docker on the server first. If the Docker Hub repository is private,
run `docker login --username udaynasya` and enter a Read token when prompted.

Create a private environment file on the server, for example
`/opt/test-tool/secrets/fleet.env`, using `apps/fleet/.env.example` as the template.
Use application URLs reachable from the server. `localhost` inside the test
container refers to the container itself.

Run from a shell on the server:

```sh
docker pull udaynasya/test_tool:latest
mkdir -p /opt/test-tool/reports/demo-001
docker run --rm --init --shm-size=1g \
  --env-file /opt/test-tool/secrets/fleet.env \
  --mount type=bind,src=/opt/test-tool/reports/demo-001,dst=/app/reports \
  udaynasya/test_tool:latest fleet --ui
```

Use a new folder instead of `demo-001` for every execution. This isolates reports
and authentication state between containers. Reports remain on disk after the
container exits, under `demo-001/ui_report/fleet/`. The Playwright report entry is
`html/index.html`; Allure output is in `allure-report/` when generation succeeds.
Use the existing app folder name and `--api`, `--ui`, or `--e2e` to choose a suite.
Omit the mode to run all suites available for that app.

Do not use headed or debug mode on the server. Tests run headlessly. The container
returns the runner's exit status, including a nonzero status for failing tests.

Environment files, reports and local dependencies are excluded from image builds.
Keep credentials out of tracked configuration and test data too, especially if
the Docker Hub image is public. Reports can contain authentication state and
application data; keep the report directory private until the dashboard provides
controlled report access. Add disk retention before repeated unattended runs.

## Optional local build and push

From the repository root on a machine with Docker:

```sh
docker login --username udaynasya
docker build -t udaynasya/test_tool:latest .
docker push udaynasya/test_tool:latest
```

The Dockerfile installs Chromium using the Playwright version from `npm ci`, so
the browser matches the locked framework version.
