import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { reportDirectory, reportModes } from './core/report_paths.js';

const root = path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
dotenv.config();
const args = process.argv.slice(2);
const flags = args.filter(arg => arg.startsWith('--'));
const [name, ...files] = args.filter(arg => !arg.startsWith('--'));
const available = () => readdirSync(path.join(root, 'apps')).filter(app => existsSync(path.join(root, 'apps', app, 'app_config.ts')));
function fail(message) { console.error(message); process.exit(2); }
const knownFlags = ['--api', '--ui', '--e2e', '--headed', '--debug', '--report', '--allure'];
for (const flag of flags) if (!knownFlags.includes(flag)) fail(`Unknown option: ${flag}`);
const selectedModes = reportModes.filter(mode => flags.includes(`--${mode}`));
if (selectedModes.length > 1) fail('Choose only one of --api, --ui or --e2e; omit these flags to run all available suites.');
if (!name || !/^[a-zA-Z0-9_-]+$/.test(name) || !existsSync(path.join(root, 'apps', name, 'app_config.ts'))) {
  fail(`Usage: npm test -- <app_name> [--api|--ui|--e2e]\nAvailable apps: ${available().join(', ')}`);
}
const mode = selectedModes[0];
const allureCli = path.join(root, 'node_modules', 'allure', 'cli.js');
const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
if (flags.includes('--report') || flags.includes('--allure')) {
  if (!mode) fail('Choose the report type, for example: npm run report -- fleet --ui (or --api / --e2e).');
  const isAllure = flags.includes('--allure');
  const report = path.join(reportDirectory(name, mode), isAllure ? 'allure-report' : 'html');
  if (!existsSync(report)) fail(`No ${mode} report found for "${name}" at ${report}. Run that suite first.`);
  process.exit(spawnSync(process.execPath, isAllure ? [allureCli, 'open', report] : [cli, 'show-report', report], { stdio: 'inherit' }).status ?? 1);
}

dotenv.config({ path: path.join(root, 'apps', name, '.env'), override: true });
process.env.TEST_APP = name;
if (flags.includes('--headed')) process.env.TEST_HEADED = '1';
if (flags.includes('--debug')) process.env.PWDEBUG = '1';
function hasSpecs(directory) {
  return existsSync(directory) && readdirSync(directory, { withFileTypes: true }).some(entry =>
    entry.isDirectory() ? hasSpecs(path.join(directory, entry.name)) : entry.isFile() && entry.name.endsWith('.spec.ts'));
}
const modes = mode ? [mode] : reportModes.filter(candidate => hasSpecs(path.join(root, 'apps', name, candidate)));
if (!modes.length) fail(`No API, UI or E2E spec files found for ${name}.`);
for (const candidate of modes) {
  if (!hasSpecs(path.join(root, 'apps', name, candidate))) fail(`No ${candidate} spec files found in apps/${name}/${candidate}. No reports were changed.`);
}
// Reserve all three categories without moving or deleting any legacy reports.
for (const category of reportModes) mkdirSync(reportDirectory(name, category), { recursive: true });
let server;
try {
  const configPath = path.join(root, 'apps', name, 'app_config.ts');
  const ts = await import('typescript');
  const text = readFileSync(configPath, 'utf8');
  const js = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { appConfig } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  if (appConfig.startCommand) {
    server = spawn(appConfig.startCommand.command, appConfig.startCommand.args ?? [], { cwd: appConfig.startCommand.cwd ? path.resolve(appConfig.startCommand.cwd) : root, env: process.env, stdio: 'inherit', windowsHide: true });
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try { const res = await fetch(appConfig.healthCheckUrl || appConfig.baseUrl, { signal: AbortSignal.timeout(500) }); if (res.ok) { ready = true; break; } } catch {}
      if (server.exitCode !== null) throw new Error(`Target start command exited with code ${server.exitCode}`);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error(`Target did not become ready at ${appConfig.healthCheckUrl || appConfig.baseUrl}`);
  }
  let runFailed = false;
  for (const category of modes) {
    process.env.TEST_MODE = category;
    const reportDir = reportDirectory(name, category);
    // Only this mode's generated outputs are replaced. Other modes and legacy files stay intact.
    for (const file of ['api_results.json', 'api_results.jsonl', 'storageState.json', 'auth_headers.json']) {
      if (existsSync(path.join(reportDir, file))) rmSync(path.join(reportDir, file));
    }
    for (const folder of ['html', 'artifacts', 'allure-results', 'allure-report']) {
      if (existsSync(path.join(reportDir, folder))) rmSync(path.join(reportDir, folder), { recursive: true, force: true });
    }
    console.log(`\nRunning ${category.toUpperCase()} suite. Reports: ${reportDir}`);
    const child = spawn(process.execPath, [cli, 'test', '-c', path.join(root, 'playwright.config.ts'), ...(flags.includes('--headed') ? ['--headed'] : []), ...files], { cwd: root, env: process.env, stdio: 'inherit', windowsHide: true });
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
    if (code !== 0) runFailed = true;
    const allureResults = path.join(reportDir, 'allure-results');
    if (existsSync(allureResults)) {
      const generated = spawnSync(process.execPath, [allureCli, 'generate', allureResults, '-c', path.join(root, 'allurerc.mjs')], { cwd: root, env: process.env, stdio: 'ignore' });
      const built = path.join(reportDir, 'allure-report', 'index.html');
      const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const shareName = `${name}-${category}-report-${date}.html`;
      if (generated.status === 0 && existsSync(built)) {
        copyFileSync(built, path.join(reportDir, shareName));
        console.log(`Report to share: ${path.join(reportDir, shareName)} (open: npm run allure -- ${name} --${category})`);
      } else console.warn(`Allure generation failed for ${category}; inspect the Playwright HTML report in ${reportDir}.`);
    }
  }
  process.exitCode = runFailed ? 1 : 0;
} catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
finally {
  if (server && server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise(resolve => server.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 2000))]);
  }
}
