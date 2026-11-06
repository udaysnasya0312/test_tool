export { flushApiResults } from './api_runner.js';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import path from 'node:path';
import { reportDirectory } from './report_paths.js';

export default class SummaryReporter implements Reporter {
  private counts = { passed: 0, failed: 0, skipped: 0, other: 0 };
  private total = 0;
  private skipped: string[] = [];

  onBegin(_config: FullConfig, suite: Suite): void { this.total = suite.allTests().length; }

  onTestEnd(_test: TestCase, result: TestResult): void {
    if (result.status === 'passed') this.counts.passed++;
    else if (result.status === 'failed' || result.status === 'timedOut') this.counts.failed++;
    else if (result.status === 'skipped') {
      this.counts.skipped++;
      const reason = result.annotations.find(a => a.type === 'skip')?.description ?? 'no reason given';
      this.skipped.push(`  - ${_test.title}: ${reason}`);
    }
    else this.counts.other++;
  }

  onEnd(_result: FullResult): void {
    console.log(`\nRun summary: ${this.counts.passed} passed, ${this.counts.failed} failed, ${this.counts.skipped} skipped (${this.total} tests).`);
    if (this.skipped.length) console.log(`Skipped:\n${this.skipped.join('\n')}`);
    const directory = reportDirectory(process.env.TEST_APP!);
    console.log(`HTML report: ${path.join(directory, 'html', 'index.html')}`);
    if (process.env.TEST_MODE === 'api') console.log(`API summary: ${path.join(directory, 'api_results.json')}`);
  }
}
