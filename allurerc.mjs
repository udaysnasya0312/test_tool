import { defineConfig } from 'allure';
import { reportDirectory } from './core/report_paths.js';
// One self-contained report per app and test mode.
const app = process.env.TEST_APP || 'app';
export default defineConfig({
  name: `${app.toUpperCase()} ${process.env.TEST_MODE?.toUpperCase()} Test Report`,
  output: `${reportDirectory(app)}/allure-report`,
  plugins: { awesome: { options: { singleFile: true, reportLanguage: 'en', groupBy: ['parentSuite', 'suite', 'subSuite'] } } }
});
