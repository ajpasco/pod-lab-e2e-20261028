// Rows that reproduce defects the founder deferred (INCREMENT.md section 9). Each is listed in
// eval/deferred.txt beside its defect id, so the runner reports it apart from the verdict until the
// founder puts the defect in; a row stays in this file once its defect is fixed, and the packet
// that fixes it removes its line from the list. Top-level test() calls only, so the TAP stays flat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { run, tempDir, stage, bytes } from './harness.mjs';

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
