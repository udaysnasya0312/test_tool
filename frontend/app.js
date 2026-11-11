const $ = id => document.getElementById(id);
let apps = [], selected = new Set(), loading = false;
const app = () => apps.find(item => item.id === $('app').value);
const suite = () => app()?.suites.find(item => item.mode === $('mode').value);
const tests = () => (suite()?.files || []).flatMap(file => file.tests.map(test => ({ ...test, file: file.file })));
function options(element, values) {
  element.replaceChildren();
  for (const [value, name] of values) { const option = document.createElement('option'); option.value = value; option.textContent = name; element.append(option); }
  element.disabled = values.length === 0;
}
function summary() {
  $('selected-count').textContent = selected.size;
  $('summary').textContent = `${selected.size} of ${tests().length} test cases selected`;
  $('select-all').disabled = loading || !tests().length;
}
function renderTests() {
  selected.clear(); $('tests').replaceChildren();
  for (const test of tests()) {
    const label = document.createElement('label'); label.className = 'test-case';
    const check = document.createElement('input'); check.type = 'checkbox'; check.dataset.id = test.id;
    check.onchange = () => { if (check.checked) selected.add(test.id); else selected.delete(test.id); summary(); };
    const text = document.createElement('span'); text.textContent = test.title;
    const file = document.createElement('small'); file.textContent = `${test.file}:${test.line}`;
    text.append(file); label.append(check, text); $('tests').append(label);
  }
  if (!tests().length) { const p = document.createElement('p'); p.textContent = 'No statically declared test cases found for this suite.'; $('tests').append(p); }
  summary();
}
function changeApp() { options($('mode'), (app()?.suites || []).map(item => [item.mode, item.mode.toUpperCase()])); renderTests(); }
async function refresh() {
  if (loading) return;
  loading = true; $('refresh').disabled = true; $('app').disabled = true; $('mode').disabled = true;
  selected.clear(); $('tests').replaceChildren(); $('select-all').disabled = true;
  $('summary').textContent = 'Loading catalog…'; $('selected-count').textContent = '0';
  $('connection').textContent = 'Connecting…'; $('error').hidden = true;
  try {
    const response = await fetch('/api/catalog', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Catalog request failed');
    const data = await response.json(); apps = data.apps;
    options($('app'), apps.map(item => [item.id, item.name])); changeApp();
    const files = apps.flatMap(item => item.suites.flatMap(s => s.files));
    $('app-count').textContent = apps.length; $('file-count').textContent = files.length;
    $('test-count').textContent = files.reduce((sum, file) => sum + file.tests.length, 0);
    $('connection').textContent = '● Catalog connected';
  } catch {
    apps = []; options($('app'), []); changeApp();
    for (const id of ['app-count', 'file-count', 'test-count']) $(id).textContent = '—';
    $('connection').textContent = 'Catalog unavailable'; $('error').textContent = 'Unable to load test cases. Check the catalog container, then refresh.'; $('error').hidden = false;
  } finally { loading = false; $('refresh').disabled = false; summary(); }
}
$('app').onchange = changeApp; $('mode').onchange = renderTests; $('refresh').onclick = refresh;
$('select-all').onclick = () => { const boxes = [...$('tests').querySelectorAll('input')]; const checked = !boxes.every(box => box.checked); for (const box of boxes) { box.checked = checked; box.onchange(); } };
$('overview').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
$('execution').onclick = () => $('execution-panel').scrollIntoView({ behavior: 'smooth' });
refresh();
