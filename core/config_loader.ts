import { existsSync } from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import ts from 'typescript';
import type { AppConfig } from './types.js';

dotenv.config();
const projectRoot = process.cwd();
export async function loadAppConfig(name: string): Promise<AppConfig> {
  const configPath = path.join(projectRoot, 'apps', name, 'app_config.ts');
  if (!existsSync(configPath)) throw new Error(`No config found for app "${name}" at ${configPath}.`);
  // App-specific settings live in apps/<name>/.env and win over the shared root .env.
  dotenv.config({ path: path.join(projectRoot, 'apps', name, '.env'), override: true });
  const source = await readFile(configPath, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { appConfig } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`) as { appConfig: AppConfig };
  const hooksPath = path.join(projectRoot, 'apps', name, 'hooks.ts');
  if (existsSync(hooksPath)) {
    const hooksSource = await readFile(hooksPath, 'utf8');
    const hooksJs = ts.transpileModule(hooksSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    const hooks = await import(`data:text/javascript;base64,${Buffer.from(hooksJs).toString('base64')}`);
    appConfig.data = { load: hooks.loadTestData ?? (async () => {}), cleanup: hooks.cleanupTestData ?? (async () => {}) };
  }
  const missing: string[] = [];
  for (const [key, value] of Object.entries({ baseUrl: appConfig.baseUrl, apiBaseUrl: appConfig.apiBaseUrl })) if (!value) missing.push(key);
  if (appConfig.auth.method !== 'none') for (const [key, value] of Object.entries({ username: appConfig.auth.username, password: appConfig.auth.password })) if (!value) missing.push(key);
  if (missing.length) throw new Error(`Missing required configuration for ${name}: ${missing.join(', ')}. Check your .env file.`);
  return appConfig;
}
