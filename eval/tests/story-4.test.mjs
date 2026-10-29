// Story 4 rows: a reader that closes the pipe early (D-3). Top-level test() calls only, so the TAP
// stays flat. The row asserts PRD REQ-02 c8 (amendment 3), the founder's choice where the PRD was
// silent: "stderr empty and exit 0 when stdout closes early". It observes only the first line the
// reader got, the exit code, stderr and the bytes of shelf.json, as every row does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { tempDir, stage, shelf, book, bytes } from './harness.mjs';

const BOOK_COUNT = 20000; // about 1.4 MB of `list` output, far more than a pipe buffer holds
const CHILD_TIMEOUT_MS = 30000; // as the harness's run(): a child still running by then is killed

function longShelf() {
  const books = [];
  for (let id = 1; id <= BOOK_COUNT; id++) books.push(book(id, 'to read', `Book number ${id}`));
  return shelf(books);
}

// Starts `list`, reads the first chunk of stdout, then closes the reading end, as `head -1` does.
// Resolves once the child has closed, with the first line it printed, its exit code and its stderr.
function listIntoClosedReader(dir) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.resolve('app/shelf.mjs'), 'list'], { cwd: dir });
    const timer = setTimeout(() => child.kill('SIGKILL'), CHILD_TIMEOUT_MS);
    let first = '';
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stdout.once('data', (chunk) => {
      first = String(chunk).split('\n')[0];
      child.stdout.destroy();
    });
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, first, stderr });
    });
  });
}

test('T-REQ-02-P7 list into a reader that closes the pipe early exits 0 with nothing on stderr', async () => {
  const dir = tempDir();
  try {
    stage(dir, longShelf());
    const before = bytes(dir);
    const r = await listIntoClosedReader(dir);
    assert.equal(r.first, '1 to read Book number 1', `the first line is ${JSON.stringify(r.first)}`);
    assert.equal(r.status, 0, `exit ${r.status} (signal ${r.signal}) where 0 is expected`);
    assert.equal(r.stderr, '', `stderr is not empty: ${JSON.stringify(r.stderr.slice(0, 160))}`);
    assert.ok(bytes(dir).equals(before), 'shelf.json is not as it was staged');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
