// Rows that reproduce defects the founder deferred (INCREMENT.md section 9). Each is listed in
// eval/deferred.txt beside its defect id, so the runner reports it apart from the verdict until the
// founder puts the defect in; a row stays in this file once its defect is fixed, and the packet
// that fixes it removes its line from the list. Top-level test() calls only, so the TAP stays flat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { run, tempDir, stage, shelf, book, bytes, listing } from './harness.mjs';

// D-4: an add at the id ceiling (the largest id shelf can store, 9007199254740991) succeeds and
// writes a next id that every command then refuses as corrupt. The row asserts only the PRD's
// Corrupt definition (section 4: a file shelf wrote on a successful command is still a shelf, so
// shelf reads it back without refusing it) and REQ-01 c1 and c2 (the shelf stays usable after a
// successful add), plus the Failed-command definition if the add is refused (nothing on stdout, a
// message on stderr, the file untouched). It never reads what next id the file stores: the
// behaviour at the ceiling is the founder's to decide (D-4, deferred), and the row rules out none
// of the options its record lists.
const CEILING = 9007199254740991;

test('T-REQ-01-N9 an add at the id ceiling never leaves a shelf that shelf refuses as corrupt', () => {
  const dir = tempDir();
  try {
    stage(dir, { nextId: CEILING, books: [] });
    const before = bytes(dir);
    const add = run(['add', 'Dune'], dir);
    if (add.status !== 0) {
      assert.equal(add.stdout, '', `a refused add printed ${JSON.stringify(add.stdout)} on stdout`);
      assert.notEqual(add.stderr, '', 'a refused add put nothing on stderr');
      assert.ok(bytes(dir).equals(before), 'a refused add changed shelf.json');
    }
    const list = run(['list'], dir);
    const refused = list.stderr.trim();
    assert.equal(list.status, 0, `list after the add exits ${list.status} where 0 is expected: ${refused}`);
    assert.equal(list.stderr, '', `list after the add put ${JSON.stringify(list.stderr)} on stderr`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// D-5: a command killed while it writes leaves its temporary file beside shelf.json for good. The
// shelf is large (about 40 MB: the book the command acts on, then 1000 to-read books with
// 40,000-character titles), so that the write takes long enough for the row to see the temporary
// file appear and send the signal before the rename. The row times its signal on the temporary
// file's name (blueprint section 7, TD-20), which is the only way to hit the window from outside
// the process; what it then asserts names no such file: a later `done 1` exits 0 and prints
// `done 1 Dune` (the shelf the kill left behind is whole and still holds the book), and the
// directory afterwards holds exactly `shelf.json`, as the restraint rows T-REQ-01-N6 and
// T-REQ-08-N1 to N3 assert after a successful or a refused write. It passes whether a fix lets the
// interrupted command finish whole (D-5's option c) or removes the stray on the next successful
// write (option b), and under option (a) it stays deferred; it chooses none of them. A trial in
// which the child ended before the temporary file was seen is inconclusive and is retried; the
// row needs one conclusive trial.
const TRIALS = 5;
const CHILD_TIMEOUT_MS = 30000; // as the harness's run(): a child still running by then is killed
const FILLER_COUNT = 1000;
const LONG_TITLE = 'x'.repeat(40000);

function largeShelf() {
  const filler = Array.from({ length: FILLER_COUNT }, (_, i) => book(2 + i, 'to read', LONG_TITLE));
  return shelf([book(1, 'to read', 'Dune'), ...filler]);
}

// Starts `done 1`, sends SIGTERM the moment `.shelf.json.<pid>.tmp` exists, and resolves once the
// child has closed, saying whether the temporary file was seen (a conclusive trial) and how it ended.
function killMidWrite(dir) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.resolve('app/shelf.mjs'), 'done', '1'], { cwd: dir });
    const temp = path.join(dir, `.shelf.json.${child.pid}.tmp`);
    let seen = false;
    const poll = setInterval(() => {
      if (!seen && fs.existsSync(temp)) {
        seen = true;
        clearInterval(poll);
        child.kill('SIGTERM');
      }
    }, 0);
    const timer = setTimeout(() => child.kill('SIGKILL'), CHILD_TIMEOUT_MS);
    child.on('close', (status, signal) => {
      clearInterval(poll);
      clearTimeout(timer);
      resolve({ seen, status, signal });
    });
  });
}

test('T-REQ-08-N5 a done killed while it writes leaves a whole shelf and nothing else in the directory', async () => {
  let conclusive = 0;
  for (let trial = 1; trial <= TRIALS && conclusive === 0; trial++) {
    const dir = tempDir();
    try {
      stage(dir, largeShelf());
      const r = await killMidWrite(dir);
      if (!r.seen) continue; // the write ended before it could be interrupted: inconclusive
      conclusive++;
      const label = `trial ${trial}: done 1 ended with exit ${r.status} (signal ${r.signal})`;
      const later = run(['done', '1'], dir);
      assert.equal(later.status, 0, `${label}, and a later done 1 exits ${later.status} where 0 is expected: ${later.stderr.trim()}`);
      assert.equal(later.stdout, 'done 1 Dune\n', `${label}, and a later done 1 printed ${JSON.stringify(later.stdout)} where "done 1 Dune" is expected`);
      const left = listing(dir);
      assert.deepEqual(left, ['shelf.json'], `${label}, and after a later successful done 1 the directory holds ${JSON.stringify(left)} where only shelf.json is expected`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  assert.ok(conclusive > 0, `no trial of ${TRIALS} saw the temporary file before the write ended`);
});

// D-6: with shelf.json a symbolic link to a file in another directory, `done 1` exits 0 and prints
// `done 1 Dune`, yet the linked file is unchanged and the link has become a regular file. The row
// asserts only that a change shelf reports as made is on the shelf the reader linked to (REQ-03 c1
// read through the link), or that the command was refused with nothing changed (the PRD's Failed
// command), and that shelf.json is still what the reader made it, a link. It passes whether a fix
// follows the link (D-6's option a) or refuses a linked shelf.json (option b), and under option (c)
// it stays deferred; it chooses none of them.
test('T-REQ-03-N10 a done through a symbolic link named shelf.json reaches the linked file or is refused', () => {
  const base = tempDir();
  try {
    const target = path.join(base, 'synced');
    const here = path.join(base, 'here');
    fs.mkdirSync(target);
    fs.mkdirSync(here);
    stage(target, shelf([book(1, 'to read', 'Dune')]));
    const before = fs.readFileSync(path.join(target, 'shelf.json'));
    fs.symlinkSync(path.join(target, 'shelf.json'), path.join(here, 'shelf.json'));
    const r = run(['done', '1'], here);
    const targetAfter = fs.readFileSync(path.join(target, 'shelf.json'));
    if (r.status !== 0) {
      assert.equal(r.stdout, '', `a refused done printed ${JSON.stringify(r.stdout)} on stdout`);
      assert.notEqual(r.stderr, '', 'a refused done put nothing on stderr');
      assert.ok(targetAfter.equals(before), 'a refused done changed the linked file');
    } else {
      const list = run(['list'], target);
      assert.equal(list.status, 0, `list in the linked file's directory exits ${list.status} where 0 is expected`);
      assert.equal(list.stdout, '1 read Dune\n', `done 1 exited 0 printing ${JSON.stringify(r.stdout.trim())}, yet the linked file lists ${JSON.stringify(list.stdout)}`);
    }
    assert.ok(fs.lstatSync(path.join(here, 'shelf.json')).isSymbolicLink(), 'shelf.json is no longer a symbolic link');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
