// Converts the TAP written by `node --test` into eval/report/rows.txt, one line per row.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const reportDir = path.join(here, 'report');
const testsDir = path.join(here, 'tests');

const STORY_IDS = {
  'story-1.test.mjs': [
    'T-REQ-01-P1',
    'T-REQ-01-P2',
    'T-REQ-01-P3',
    'T-REQ-01-P4',
    'T-REQ-01-P5',
    'T-REQ-01-P6',
    'T-REQ-01-P8',
    'T-REQ-01-P10',
    'T-REQ-01-P11',
    'T-REQ-01-N1',
    'T-REQ-01-N2',
    'T-REQ-01-N3',
    'T-REQ-01-N4',
    'T-REQ-01-N5',
    'T-REQ-01-N6',
    'T-REQ-01-N7',
    'T-REQ-01-N8',
    'T-REQ-02-P1',
    'T-REQ-02-P2',
    'T-REQ-02-P4',
    'T-REQ-02-P5',
    'T-REQ-02-P6',
    'T-REQ-02-N1',
    'T-REQ-02-N2',
    'T-REQ-05-P1',
    'T-REQ-05-P2',
    'T-REQ-05-P3',
    'T-REQ-05-N1',
    'T-REQ-05-N2',
    'T-REQ-05-N3',
    'T-REQ-06-P1',
    'T-REQ-06-N1',
    'T-REQ-06-N4',
    'T-REQ-06-N6',
    'T-REQ-07-P1',
    'T-REQ-07-P2',
    'T-REQ-07-N1',
    'T-REQ-07-N2',
    'T-REQ-08-P1',
    'T-REQ-08-N1',
    'T-REQ-09-P1',
    'T-REQ-09-P2',
    'T-REQ-09-P5',
    'T-REQ-09-P6',
    'T-REQ-09-N1',
    'T-REQ-09-N2',
    'T-REQ-09-N5',
    'T-REQ-09-N6',
  ],
  'story-2.test.mjs': [
    'T-REQ-01-P7',
    'T-REQ-01-P9',
    'T-REQ-02-P3',
    'T-REQ-03-P1',
    'T-REQ-03-P2',
    'T-REQ-03-P3',
    'T-REQ-03-P4',
    'T-REQ-03-P5',
    'T-REQ-03-N1',
    'T-REQ-03-N2',
    'T-REQ-03-N3',
    'T-REQ-03-N4',
    'T-REQ-03-N5',
    'T-REQ-03-N6',
    'T-REQ-03-N7',
    'T-REQ-03-N8',
    'T-REQ-03-N9',
    'T-REQ-04-P1',
    'T-REQ-04-P2',
    'T-REQ-04-P3',
    'T-REQ-04-P4',
    'T-REQ-04-P5',
    'T-REQ-04-N1',
    'T-REQ-04-N2',
    'T-REQ-04-N3',
    'T-REQ-04-N4',
    'T-REQ-04-N5',
    'T-REQ-04-N6',
    'T-REQ-04-N7',
    'T-REQ-04-N8',
    'T-REQ-04-N9',
    'T-REQ-06-N2',
    'T-REQ-06-N3',
    'T-REQ-06-N5',
    'T-REQ-07-P3',
    'T-REQ-07-P4',
    'T-REQ-07-N3',
    'T-REQ-07-N4',
    'T-REQ-08-P2',
    'T-REQ-08-P3',
    'T-REQ-08-N2',
    'T-REQ-08-N3',
    'T-REQ-09-P3',
    'T-REQ-09-P4',
    'T-REQ-09-P7',
    'T-REQ-09-P8',
    'T-REQ-09-N3',
    'T-REQ-09-N4',
    'T-REQ-09-N7',
    'T-REQ-09-N8',
  ],
  'story-3.test.mjs': ['T-REQ-08-N4'],
};

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function oneLine(text) {
  const collapsed = String(text).replace(/\s+/g, ' ').trim().slice(0, 200).trim();
  return collapsed === '' ? 'assertion failed' : collapsed;
}

function unquote(value) {
  const quote = value[0];
  if (quote !== "'" && quote !== '"') return value;
  let inner = value.slice(1);
  if (inner.endsWith(quote)) inner = inner.slice(0, -1);
  return quote === "'" ? inner.replace(/''/g, "'") : inner;
}

// The first line of the error text in the YAML block that follows a failing test.
function errorText(block) {
  for (let i = 0; i < block.length; i++) {
    const found = /^\s*error:\s*(.*)$/.exec(block[i]);
    if (!found) continue;
    const value = found[1].trim();
    if (/^[|>][+-]?$/.test(value)) {
      const next = block.slice(i + 1).find((line) => line.trim() !== '');
      return next === undefined ? '' : next.trim();
    }
    return unquote(value);
  }
  return '';
}

// Flat TAP: top-level `ok N - title` and `not ok N - title`, each followed by indented lines.
function parseTap(text) {
  const results = new Map();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const head = /^(not ok|ok) \d+ - (.*)$/.exec(lines[i]);
    if (!head) continue;
    const skipped = /\s#\s*SKIP\b/i.test(head[2]);
    const title = head[2].replace(/\s+#\s*(SKIP|TODO).*$/i, '').trim();
    const id = title.split(/\s+/)[0];
    const block = [];
    for (let j = i + 1; j < lines.length && /^\s/.test(lines[j]); j++) block.push(lines[j]);
    let entry;
    if (head[1] === 'ok') entry = { state: skipped ? 'skip' : 'pass', reason: '' };
    else entry = { state: 'fail', reason: oneLine(errorText(block)) };
    const earlier = results.get(id);
    if (!earlier || (earlier.state !== 'fail' && entry.state === 'fail')) results.set(id, entry);
  }
  return results;
}

// Row id first, then the first whole word D-<k> after it. Other lines defer nothing.
function parseDeferred(text) {
  const deferred = new Map();
  for (const line of (text ?? '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const parts = /^(\S+)(.*)$/.exec(trimmed);
    const defect = /(?:^|[^A-Za-z0-9_])(D-[0-9]+)(?![A-Za-z0-9_])/.exec(parts[2]);
    if (defect && !deferred.has(parts[1])) deferred.set(parts[1], defect[1]);
  }
  return deferred;
}

function expectedIds() {
  const ids = [];
  for (const [file, list] of Object.entries(STORY_IDS)) {
    if (fs.existsSync(path.join(testsDir, file))) ids.push(...list);
  }
  return ids;
}

function deferredLine(id, defect, report) {
  const found = report === null ? undefined : report.get(id);
  if (found === undefined) return `fail ${id} did not finish`;
  if (found.state === 'skip') return `fail ${id} skipped`;
  if (found.state === 'pass') return `pass ${id}`;
  return `deferred ${id} ${defect} ${found.reason}`;
}

function verdictLine(id, found) {
  if (found === undefined) return `fail ${id} did not run`;
  if (found.state === 'skip') return `fail ${id} skipped`;
  if (found.state === 'pass') return `pass ${id}`;
  return `fail ${id} ${found.reason}`;
}

function main() {
  const verdict = parseTap(readIfExists(path.join(reportDir, 'tap.txt')) ?? '');
  const deferredText = readIfExists(path.join(reportDir, 'deferred-read.txt'));
  const deferred = parseDeferred(deferredText ?? readIfExists(path.join(here, 'deferred.txt')));
  const deferredTap = readIfExists(path.join(reportDir, 'tap-deferred.txt'));
  const report = deferredTap === null ? null : parseTap(deferredTap);

  const out = [];
  for (const id of expectedIds()) {
    if (deferred.has(id)) out.push(deferredLine(id, deferred.get(id), report));
    else out.push(verdictLine(id, verdict.get(id)));
  }

  const status = process.env.POD_VERDICT_STATUS;
  const failed = out.some((line) => line.startsWith('fail '));
  if (status !== undefined && status !== '' && status !== '0' && !failed) {
    out.push(`fail node-test exited ${status} with every row reported`);
  }

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'rows.txt'), out.join('\n') + '\n');
}

main();
