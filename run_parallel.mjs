// Runs the API and UI suites of one app at the same time, as two separate run_tests.mjs
// processes (each keeps its own reports under reports/api_report/<app> and reports/ui_report/<app>).
// Usage: npm run test:api-ui -- <app> [--headed]
// Apps that allow one session per account (e.g. pcb) need separate accounts per suite;
// see the app's README.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const [app] = args.filter(arg => !arg.startsWith('--'));
const extra = args.filter(arg => arg === '--headed');
if (!app) {
  console.error('Usage: npm run test:api-ui -- <app_name> [--headed]');
  process.exit(2);
}

function run(mode) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(root, 'run_tests.mjs'), app, `--${mode}`, ...extra], { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    // Prefix every line so the two interleaved outputs stay readable.
    const forward = (stream, target) => {
      let buffer = '';
      stream.on('data', chunk => {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) target.write(`[${mode}] ${line}\n`);
      });
      stream.on('end', () => { if (buffer) target.write(`[${mode}] ${buffer}\n`); });
    };
    forward(child.stdout, process.stdout);
    forward(child.stderr, process.stderr);
    child.once('error', error => { console.error(`[${mode}] ${error.message}`); resolve(1); });
    child.once('exit', code => resolve(code ?? 1));
  });
}

const [api, ui] = await Promise.all([run('api'), run('ui')]);
console.log(`\nAPI suite exit code: ${api} | UI suite exit code: ${ui}`);
process.exitCode = api === 0 && ui === 0 ? 0 : 1;
