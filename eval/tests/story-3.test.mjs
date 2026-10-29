// Story 3 rows: two commands at once (D-2). Top-level test() calls only, so the TAP stays flat.
// The row asserts PRD REQ-08 c5 (amendment 2) for two `done` commands started in the same moment:
// a `done` refused as unable to write changes nothing (its book is still "to read" in `list`), and
// a `done` that exited 0 printed a line that was true of the shelf at some moment, so at least one
// exit-0 command's book is "read" afterwards. It does not assert that both changes survive, which
// blueprint section 8 (TD-17, last write wins) accepts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { run, tempDir, stage, shelf, book } from './harness.mjs';

const TRIALS = 40;
const BOOKS = [book(1, 'to read', 'Dune'), book(2, 'to read', 'Emma')];
const duneAndEmma = () => shelf(BOOKS);
const titleOf = (id) => BOOKS.find((candidate) => candidate.id === Number(id)).title;

// Two runs started in the same tick; resolves with both results once both have closed.
function atOnce(dir, first, second) {
  const app = path.resolve('app/shelf.mjs');
  const start = (args) =>
    new Promise((resolve) => {
      const child = spawn(process.execPath, [app, ...args], { cwd: dir });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => (stdout += chunk));
      child.stderr.on('data', (chunk) => (stderr += chunk));
      child.on('close', (status) => resolve({ id: args[1], status, stdout, stderr }));
    });
  return Promise.all([start(first), start(second)]);
}

// The lines `list` prints once both commands have ended: what the reader sees.
function listLines(dir) {
  const r = run(['list'], dir);
  assert.equal(r.status, 0, `list afterwards: exit ${r.status} where 0 is expected`);
  return r.stdout.split('\n').filter((line) => line !== '');
}

// A refused command (non-zero exit) printed nothing and its book is still "to read".
function assertRefusedChangedNothing(r, lines, trial) {
  const label = `trial ${trial}, done ${r.id} exited ${r.status} (${r.stderr.trim()})`;
  const got = JSON.stringify(r.stdout);
  assert.equal(r.stdout, '', `${label}: stdout is ${got} where "" is expected`);
  const line = lines.find((candidate) => candidate.startsWith(`${r.id} `));
  const want = `${r.id} to read ${titleOf(r.id)}`;
  assert.equal(line, want, `${label}: yet list shows "${line}" where "${want}" is expected`);
}

// Among the commands that exited 0, at least one printed a line that is true of the shelf now.
function assertASuccessIsOnTheShelf(successes, lines, trial) {
  if (successes.length === 0) return;
  const landed = successes.some((r) => lines.includes(`${r.id} read ${titleOf(r.id)}`));
  const ids = successes.map((r) => `done ${r.id}`).join(' and ');
  const shown = JSON.stringify(lines);
  assert.ok(landed, `trial ${trial}: ${ids} exited 0, yet list shows ${shown}: no book is read`);
}

test('T-REQ-08-N4 two dones at once: a refused one changes nothing and a success line is true', async () => {
  for (let trial = 1; trial <= TRIALS; trial++) {
    const dir = tempDir();
    try {
      stage(dir, duneAndEmma());
      const results = await atOnce(dir, ['done', '1'], ['done', '2']);
      const lines = listLines(dir);
      for (const r of results.filter((one) => one.status !== 0)) {
        assertRefusedChangedNothing(r, lines, trial);
      }
      assertASuccessIsOnTheShelf(results.filter((one) => one.status === 0), lines, trial);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});
