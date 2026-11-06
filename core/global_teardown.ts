import { flushApiResults } from './api_runner.js';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { reportDirectory } from './report_paths.js';
export default async function globalTeardown(): Promise<void> {
  const app = process.env.TEST_APP;
  if (app && process.env.TEST_MODE !== 'ui') {
    const lines = path.join(reportDirectory(app), 'api_results.jsonl');
    if (process.env.TEST_MODE === 'e2e' && !existsSync(lines)) return;
    await flushApiResults(app);
    try {
      const entries = (await readFile(lines, 'utf8')).split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
      await writeFile(path.join(reportDirectory(app), 'api_results.json'), JSON.stringify(entries, null, 2));
    } catch { /* no API cases ran */ }
  }
}
