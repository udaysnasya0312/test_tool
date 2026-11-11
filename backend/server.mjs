import http from 'node:http';
import path from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';
import ts from 'typescript';

const root = path.resolve(process.env.FRAMEWORK_ROOT || '..');
async function specs(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await specs(file));
    else if (entry.isFile() && entry.name.endsWith('.spec.ts')) files.push(file);
  }
  return files.sort();
}

function testsIn(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const tests = [];
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const title = node.arguments[0];
      if (/^test(?:\.(only|skip|fixme))?$/.test(node.expression.getText(tree)) && title &&
          (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title))) {
        const line = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
        tests.push({ id: `${filename}:${line}`, title: title.text, line });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return tests;
}

async function catalog() {
  const apps = [];
  for (const entry of await readdir(path.join(root, 'apps'), { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^[a-zA-Z0-9_-]+$/.test(entry.name)) continue;
    const directory = path.join(root, 'apps', entry.name);
    const configured = await stat(path.join(directory, 'app_config.ts')).then(s => s.isFile()).catch(() => false);
    if (!configured) continue;
    const suites = [];
    for (const mode of ['api', 'ui', 'e2e']) {
      const files = [];
      for (const filename of await specs(path.join(directory, mode))) {
        const relative = path.relative(root, filename).split(path.sep).join('/');
        files.push({ file: relative, tests: testsIn(await readFile(filename, 'utf8'), relative) });
      }
      if (files.length) suites.push({ mode, files });
    }
    apps.push({ id: entry.name, name: entry.name === 'task_app' ? 'Task App' : entry.name, suites });
  }
  return apps.sort((a, b) => a.id.localeCompare(b.id));
}

http.createServer(async (req, res) => {
  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  if (req.method !== 'GET') return send(405, { error: 'This API is read-only.' });
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/health') return send(200, { status: 'ok' });
  if (pathname !== '/api/catalog') return send(404, { error: 'Not found' });
  try { send(200, { apps: await catalog() }); }
  catch (error) { console.error(error); send(500, { error: 'Unable to read framework apps. Check FRAMEWORK_ROOT and the volume mount.' }); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Catalog API ready'));
