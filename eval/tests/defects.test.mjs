// Rows that reproduce defects the founder deferred (INCREMENT.md section 9). Each is listed in
// eval/deferred.txt beside its defect id, so the runner reports it apart from the verdict until the
// founder puts the defect in; a row stays in this file once its defect is fixed, and the packet
// that fixes it removes its line from the list. Top-level test() calls only, so the TAP stays flat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { run, tempDir, stage, bytes } from './harness.mjs';

// D-4: an add at the id ceiling (the largest safe integer) succeeds and writes a next id of 2^53,
// which every command then refuses as corrupt. The row asserts only the PRD's Corrupt definition
// (section 4: a file shelf wrote on a successful command is still a shelf) and REQ-01 c1 and c2
// (the shelf stays usable after a successful add). It chooses no behaviour at the ceiling, which
// the founder has not decided: it passes whether that add is refused with the file untouched or
// accepted with a next id shelf can read back.
const CEILING = Number.MAX_SAFE_INTEGER; // 9007199254740991

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
    const doc = JSON.parse(bytes(dir).toString('utf8'));
    assert.ok(Number.isSafeInteger(doc.nextId), `nextId ${doc.nextId} is not a safe integer`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
