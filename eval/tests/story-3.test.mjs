// Story 3 rows: two commands at once (D-2). Top-level test() calls only, so the TAP stays flat.
// The row asserts PRD REQ-08 c5 (amendment 2) for two `done` commands started in the same moment:
// a `done` refused as unable to write changes nothing (its book is still "to read" in `list`), and
// a `done` that exited 0 printed a line that was true of the shelf at some moment, so at least one
// exit-0 command's book is "read" afterwards. It does not assert that both changes survive, which
// blueprint section 8 (TD-17, last write wins) accepts.
//
// The shelf is large (about 16 MB: the two books the commands act on, then 400 to-read books with
// 40,000-character titles), so that each command's write of the file takes milliseconds rather than
// microseconds and two writes started in the same moment overlap in most trials on a slow or busy
// machine as well as on a fast one. The first draft of this row staged two books alone; it failed on
// a laptop and passed on GitHub's runner, where the two writes never overlapped in forty trials.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { tempDir, stage, shelf, book } from './harness.mjs';

const TRIALS = 40;
const CHILD_TIMEOUT_MS = 30000; // as the harness's run(): a child still running by then is killed
const TARGETS = [book(1, 'to read', 'Dune'), book(2, 'to read', 'Emma')];
const FILLER_COUNT = 400;
const LONG_TITLE = 'x'.repeat(40000);
const FILLER = Array.from({ length: FILLER_COUNT }, (_, i) =>
  book(TARGETS.length + 1 + i, 'to read', LONG_TITLE),
);
const largeShelf = () => shelf([...TARGETS, ...FILLER]);
const titleOf = (id) => TARGETS.find((candidate) => candidate.id === Number(id)).title;
const isTargetLine = (line) => TARGETS.some((target) => line.startsWith(`${target.id} `));

// One run of the application, started now; resolves once it has closed. Its own spawn rather than
// the harness's synchronous run(), so that two runs can be started in the same tick and so that
// `list` of a 16 MB shelf is read without the synchronous runner's 1 MB output limit.
function start(dir, args) {
  const app = path.resolve('app/shelf.mjs');
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [app, ...args], { cwd: dir });
    const timer = setTimeout(() => child.kill('SIGKILL'), CHILD_TIMEOUT_MS);
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ id: args[1], status, stdout, stderr });
    });
  });
}

// Two runs started in the same tick; resolves with both results once both have closed.
function atOnce(dir, first, second) {
  return Promise.all([start(dir, first), start(dir, second)]);
}

// The lines `list` prints for the two books once both commands have ended: what the reader sees.
// A `list` that is refused means the shelf is not whole, which no exit-0 command's line describes.
async function targetListLines(dir, trial) {
  const r = await start(dir, ['list']);
  const label = `trial ${trial}: list afterwards exited ${r.status} (${r.stderr.trim()})`;
  assert.equal(r.status, 0, `${label} where 0 is expected`);
  return r.stdout.split('\n').filter(isTargetLine);
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
      stage(dir, largeShelf());
      const results = await atOnce(dir, ['done', '1'], ['done', '2']);
      for (const r of results) {
        const label = `trial ${trial}, done ${r.id}`;
        assert.notEqual(r.status, null, `${label}: did not end within ${CHILD_TIMEOUT_MS / 1000} s`);
      }
      const lines = await targetListLines(dir, trial);
      for (const r of results.filter((one) => one.status !== 0)) {
        assertRefusedChangedNothing(r, lines, trial);
      }
      assertASuccessIsOnTheShelf(results.filter((one) => one.status === 0), lines, trial);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});
