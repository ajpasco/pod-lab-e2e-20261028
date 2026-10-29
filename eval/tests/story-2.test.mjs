// Story 2 rows: done and drop, and the missing, unreadable, corrupt and unwritable shelf file for
// those two commands. Top-level test() calls only, so the TAP stays flat. The helpers below are
// the same shape as story-1.test.mjs's; each file keeps its own so that neither depends on the other.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  run,
  tempDir,
  stage,
  shelf,
  book,
  bytes,
  listing,
  makeUnreadable,
  makeUnwritableFile,
  makeUnwritableDir,
  restore,
} from './harness.mjs';

const CORRUPT_JSON = '{"nextId": 1, "books": [';
const CORRUPT_SHAPES = ['[]', '42', '{"nextId": 1}', '{"books": []}'];
const NON_NUMERIC = ['abc', '1.5', '-1', '1a', '+1'];

const text = (...lines) => (lines.length === 0 ? '' : lines.join('\n') + '\n');
const at = (label) => (label ? `${label}: ` : '');
const dune = () => shelf([book(1, 'to read', 'Dune')]);
const duneRead = () => shelf([book(1, 'read', 'Dune')]);
const duneAndEmma = () => shelf([book(1, 'to read', 'Dune'), book(2, 'to read', 'Emma')]);
const duneAndEmmaRead = () => shelf([book(1, 'to read', 'Dune'), book(2, 'read', 'Emma')]);
const three = () =>
  shelf([book(1, 'to read', 'Dune'), book(2, 'to read', 'Emma'), book(3, 'to read', 'Ulysses')]);
const SEVEN_TITLES = ['Dune', 'Emma', 'Beloved', 'Middlemarch', 'Persuasion', 'Hamlet', 'Ulysses'];
const seven = () => shelf(SEVEN_TITLES.map((title, index) => book(index + 1, 'to read', title)));
const sevenLines = (readId) =>
  text(...SEVEN_TITLES.map((title, i) => `${i + 1} ${i + 1 === readId ? 'read' : 'to read'} ${title}`));

// A fresh temporary directory for one row, always restored and removed afterwards.
function withDir(body) {
  const dir = tempDir();
  try {
    return body(dir);
  } finally {
    restore(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Stage `content` (an object, a raw string, or null for no file), run once, report the bytes.
function runOn(content, args) {
  return withDir((dir) => {
    if (content !== null) stage(dir, content);
    const before = bytes(dir);
    const r = run(args, dir);
    return { r, before, after: bytes(dir) };
  });
}

// A shelf of {1 to read Dune} made unreadable, one run, permissions restored before the bytes.
function runUnreadable(args) {
  return withDir((dir) => {
    stage(dir, dune());
    const before = bytes(dir);
    let r;
    try {
      makeUnreadable(dir);
      r = run(args, dir);
    } finally {
      restore(dir);
    }
    return { r, before, after: bytes(dir) };
  });
}

// A shelf of {1 to read Dune} made unwritable as a read-only file or a read-only directory.
function runUnwritable(args, variant) {
  return withDir((dir) => {
    stage(dir, dune());
    const before = bytes(dir);
    const listBefore = listing(dir);
    let r;
    try {
      if (variant === 'file') makeUnwritableFile(dir);
      else makeUnwritableDir(dir);
      r = run(args, dir);
    } finally {
      restore(dir);
    }
    return { r, before, after: bytes(dir), listBefore, listAfter: listing(dir) };
  });
}

const UNWRITABLE_VARIANTS = [
  ['file', 'read-only file'],
  ['dir', 'read-only directory'],
];

function assertStatus(r, code, label = '') {
  assert.equal(r.status, code, `${at(label)}exit ${r.status} where ${code} is expected`);
}

function assertStdout(r, expected, label = '') {
  const got = JSON.stringify(r.stdout);
  const want = JSON.stringify(expected);
  assert.equal(r.stdout, expected, `${at(label)}stdout is ${got} where ${want} is expected`);
}

function assertSucceeds(r, expected, label = '') {
  assertStatus(r, 0, label);
  assertStdout(r, expected, label);
}

function assertRefused(r, code, label = '') {
  assertStatus(r, code, label);
  assert.ok(r.stderr.length > 0, `${at(label)}stderr is empty`);
  assertStdout(r, '', label);
}

function assertUntouched(before, after, label = '') {
  const same = before === null ? after === null : after !== null && before.equals(after);
  assert.ok(same, `${at(label)}shelf.json is not as it was staged`);
}

function given(args, dir) {
  const r = run(args, dir);
  assertStatus(r, 0, `given ${args.join(' ')}`);
  return r;
}

// REQ-01: add a book (the real-command forms of c6 and c7)

test('T-REQ-01-P7 an id taken by a dropped book is not reused, with the real drop', () => {
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    given(['add', 'Emma'], dir);
    given(['add', 'Ulysses'], dir);
    given(['drop', '3'], dir);
    assertSucceeds(run(['add', 'X'], dir), text('added 4 X'));
  });
});

test('T-REQ-01-P9 ids stay above any used before when every book was dropped', () => {
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    given(['add', 'Emma'], dir);
    given(['drop', '1'], dir);
    given(['drop', '2'], dir);
    assertStdout(run(['list'], dir), '', 'list');
    assertStdout(run(['add', 'Ulysses'], dir), text('added 3 Ulysses'), 'add');
  });
});

// REQ-02: list the books (the real-command form of c2)

test('T-REQ-02-P3 list is in ascending id order after done out of order', () => {
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    given(['add', 'Emma'], dir);
    given(['add', 'Ulysses'], dir);
    given(['done', '3'], dir);
    given(['done', '1'], dir);
    assertStdout(run(['list'], dir), text('1 read Dune', '2 to read Emma', '3 read Ulysses'));
  });
});

// REQ-03: mark a book read

test('T-REQ-03-P1 done marks a book read', () => {
  withDir((dir) => {
    stage(dir, duneAndEmma());
    assertSucceeds(run(['done', '1'], dir), text('done 1 Dune'), 'done 1');
    assertStdout(run(['list'], dir), text('1 read Dune', '2 to read Emma'), 'list');
  });
});

test('T-REQ-03-P2 done leaves the other books unchanged', () => {
  withDir((dir) => {
    stage(dir, three());
    given(['done', '1'], dir);
    const want = text('1 read Dune', '2 to read Emma', '3 to read Ulysses');
    assertStdout(run(['list'], dir), want, 'list');
  });
});

test('T-REQ-03-P3 done on a read book succeeds again and leaves it read', () => {
  withDir((dir) => {
    stage(dir, duneRead());
    assertSucceeds(run(['done', '1'], dir), text('done 1 Dune'), 'done 1');
    assertStdout(run(['list'], dir), text('1 read Dune'), 'list');
  });
});

test('T-REQ-03-P4 done 007 marks book 7 read', () => {
  withDir((dir) => {
    stage(dir, seven());
    assertSucceeds(run(['done', '007'], dir), text('done 7 Ulysses'), 'done 007');
    assertStdout(run(['list'], dir), sevenLines(7), 'list');
  });
});

test('T-REQ-03-P5 done ignores an extra argument', () => {
  withDir((dir) => {
    stage(dir, duneAndEmma());
    assertSucceeds(run(['done', '1', '2'], dir), text('done 1 Dune'), 'done 1 2');
    assertStdout(run(['list'], dir), text('1 read Dune', '2 to read Emma'), 'list');
  });
});

test('T-REQ-03-N1 done with no id is refused', () => {
  assertRefused(runOn(dune(), ['done']).r, 2);
});

test('T-REQ-03-N2 done with a non-numeric id is refused', () => {
  for (const id of NON_NUMERIC) {
    assertRefused(runOn(dune(), ['done', id]).r, 2, `done ${id}`);
  }
});

test('T-REQ-03-N3 done with an unknown id is refused', () => {
  assertRefused(runOn(dune(), ['done', '99']).r, 1);
});

test('T-REQ-03-N4 done 0 is refused as an unknown id', () => {
  assertRefused(runOn(dune(), ['done', '0']).r, 1);
});

test('T-REQ-03-N5 refused done commands leave the shelf unchanged', () => {
  withDir((dir) => {
    stage(dir, duneAndEmmaRead());
    const before = bytes(dir);
    run(['done'], dir);
    run(['done', 'abc'], dir);
    run(['done', '99'], dir);
    assertUntouched(before, bytes(dir));
    assertStdout(run(['list'], dir), text('1 to read Dune', '2 read Emma'), 'list');
  });
});

test('T-REQ-03-N6 a non-numeric id beats a corrupt file', () => {
  const { r, before, after } = runOn(CORRUPT_JSON, ['done', 'abc']);
  assertRefused(r, 2);
  assertUntouched(before, after);
});

test('T-REQ-03-N7 a missing id beats an unreadable file', () => {
  const { r, before, after } = runUnreadable(['done']);
  assertRefused(r, 2);
  assertUntouched(before, after);
});

test('T-REQ-03-N8 done 007 with no book 7 is refused', () => {
  assertRefused(runOn(dune(), ['done', '007']).r, 1);
});

test('T-REQ-03-N9 done with an empty-string id is refused', () => {
  assertRefused(runOn(dune(), ['done', '']).r, 2);
});

// REQ-04: drop a book

test('T-REQ-04-P1 drop removes a book', () => {
  withDir((dir) => {
    stage(dir, three());
    assertSucceeds(run(['drop', '2'], dir), text('dropped 2 Emma'), 'drop 2');
    const lines = run(['list'], dir).stdout.split('\n');
    assert.ok(!lines.some((line) => line.startsWith('2 ')), 'list still shows book 2');
  });
});

test('T-REQ-04-P2 drop leaves the other books unchanged', () => {
  withDir((dir) => {
    stage(dir, three());
    given(['drop', '2'], dir);
    assertStdout(run(['list'], dir), text('1 to read Dune', '3 to read Ulysses'), 'list');
  });
});

test('T-REQ-04-P3 a read book and a to-read book can both be dropped', () => {
  withDir((dir) => {
    stage(dir, shelf([book(1, 'read', 'Dune'), book(2, 'to read', 'Emma')]));
    assertStatus(run(['drop', '1'], dir), 0, 'drop 1');
    assertStatus(run(['drop', '2'], dir), 0, 'drop 2');
    assertStdout(run(['list'], dir), '', 'list');
  });
});

test('T-REQ-04-P4 drop 007 drops book 7', () => {
  withDir((dir) => {
    stage(dir, seven());
    assertSucceeds(run(['drop', '007'], dir), text('dropped 7 Ulysses'), 'drop 007');
    const want = text(...SEVEN_TITLES.slice(0, 6).map((title, i) => `${i + 1} to read ${title}`));
    assertStdout(run(['list'], dir), want, 'list');
  });
});

test('T-REQ-04-P5 drop ignores an extra argument', () => {
  withDir((dir) => {
    stage(dir, duneAndEmma());
    assertSucceeds(run(['drop', '1', '2'], dir), text('dropped 1 Dune'), 'drop 1 2');
    assertStdout(run(['list'], dir), text('2 to read Emma'), 'list');
  });
});

test('T-REQ-04-N1 drop with no id is refused', () => {
  assertRefused(runOn(dune(), ['drop']).r, 2);
});

test('T-REQ-04-N2 drop with a non-numeric id is refused', () => {
  for (const id of NON_NUMERIC) {
    assertRefused(runOn(dune(), ['drop', id]).r, 2, `drop ${id}`);
  }
});

test('T-REQ-04-N3 drop with an unknown id is refused', () => {
  assertRefused(runOn(dune(), ['drop', '99']).r, 1);
});

test('T-REQ-04-N4 drop 0 is refused as an unknown id', () => {
  assertRefused(runOn(dune(), ['drop', '0']).r, 1);
});

test('T-REQ-04-N5 refused drop commands leave the shelf unchanged', () => {
  withDir((dir) => {
    stage(dir, duneAndEmmaRead());
    const before = bytes(dir);
    run(['drop'], dir);
    run(['drop', 'abc'], dir);
    run(['drop', '99'], dir);
    assertUntouched(before, bytes(dir));
    assertStdout(run(['list'], dir), text('1 to read Dune', '2 read Emma'), 'list');
  });
});

test('T-REQ-04-N6 a non-numeric id beats a corrupt file', () => {
  const { r, before, after } = runOn(CORRUPT_JSON, ['drop', 'abc']);
  assertRefused(r, 2);
  assertUntouched(before, after);
});

test('T-REQ-04-N7 drop 007 with no book 7 is refused', () => {
  assertRefused(runOn(dune(), ['drop', '007']).r, 1);
});

test('T-REQ-04-N8 drop with an empty-string id is refused', () => {
  assertRefused(runOn(dune(), ['drop', '']).r, 2);
});

test('T-REQ-04-N9 a missing id beats a corrupt file', () => {
  const { r, before, after } = runOn(CORRUPT_JSON, ['drop']);
  assertRefused(r, 2);
  assertUntouched(before, after);
});

// REQ-06: a missing shelf file is an empty shelf

test('T-REQ-06-N2 done with no shelf.json is refused and creates no file', () => {
  const { r, after } = runOn(null, ['done', '1']);
  assertRefused(r, 1);
  assert.equal(after, null, 'shelf.json was created');
});

test('T-REQ-06-N3 drop with no shelf.json is refused and creates no file', () => {
  const { r, after } = runOn(null, ['drop', '1']);
  assertRefused(r, 1);
  assert.equal(after, null, 'shelf.json was created');
});

test('T-REQ-06-N5 a non-numeric id with no shelf.json creates no file', () => {
  const { r, after } = runOn(null, ['done', 'abc']);
  assertRefused(r, 2);
  assert.equal(after, null, 'shelf.json was created');
});

// REQ-07: refuse an unreadable shelf file

test('T-REQ-07-P3 done on an unreadable shelf is refused', () => {
  assertRefused(runUnreadable(['done', '1']).r, 1);
});

test('T-REQ-07-P4 drop on an unreadable shelf is refused', () => {
  assertRefused(runUnreadable(['drop', '1']).r, 1);
});

test('T-REQ-07-N3 done leaves an unreadable shelf untouched', () => {
  const { before, after } = runUnreadable(['done', '1']);
  assertUntouched(before, after);
});

test('T-REQ-07-N4 drop leaves an unreadable shelf untouched', () => {
  const { before, after } = runUnreadable(['drop', '1']);
  assertUntouched(before, after);
});

// REQ-08: refuse when the shelf file cannot be written

test('T-REQ-08-P2 done on an unwritable shelf is refused', () => {
  for (const [variant, label] of UNWRITABLE_VARIANTS) {
    assertRefused(runUnwritable(['done', '1'], variant).r, 1, label);
  }
});

test('T-REQ-08-P3 drop on an unwritable shelf is refused', () => {
  for (const [variant, label] of UNWRITABLE_VARIANTS) {
    assertRefused(runUnwritable(['drop', '1'], variant).r, 1, label);
  }
});

test('T-REQ-08-N2 done changes nothing on disk when the shelf is unwritable', () => {
  for (const [variant, label] of UNWRITABLE_VARIANTS) {
    const result = runUnwritable(['done', '1'], variant);
    assertUntouched(result.before, result.after, label);
    assert.deepEqual(result.listAfter, result.listBefore, `${label}: the directory listing changed`);
  }
});

test('T-REQ-08-N3 drop changes nothing on disk when the shelf is unwritable', () => {
  for (const [variant, label] of UNWRITABLE_VARIANTS) {
    const result = runUnwritable(['drop', '1'], variant);
    assertUntouched(result.before, result.after, label);
    assert.deepEqual(result.listAfter, result.listBefore, `${label}: the directory listing changed`);
  }
});

// REQ-09: refuse a corrupt shelf file

test('T-REQ-09-P3 done on a corrupt shelf is refused', () => {
  assertRefused(runOn(CORRUPT_JSON, ['done', '1']).r, 1);
});

test('T-REQ-09-P4 drop on a corrupt shelf is refused', () => {
  assertRefused(runOn(CORRUPT_JSON, ['drop', '1']).r, 1);
});

test('T-REQ-09-P7 done on a wrong-shape shelf is refused', () => {
  for (const content of CORRUPT_SHAPES) {
    assertRefused(runOn(content, ['done', '1']).r, 1, content);
  }
});

test('T-REQ-09-P8 drop on a wrong-shape shelf is refused', () => {
  for (const content of CORRUPT_SHAPES) {
    assertRefused(runOn(content, ['drop', '1']).r, 1, content);
  }
});

test('T-REQ-09-N3 done leaves a corrupt shelf untouched', () => {
  const { before, after } = runOn(CORRUPT_JSON, ['done', '1']);
  assertUntouched(before, after);
});

test('T-REQ-09-N4 drop leaves a corrupt shelf untouched', () => {
  const { before, after } = runOn(CORRUPT_JSON, ['drop', '1']);
  assertUntouched(before, after);
});

test('T-REQ-09-N7 done leaves a wrong-shape shelf untouched', () => {
  for (const content of CORRUPT_SHAPES) {
    const { before, after } = runOn(content, ['done', '1']);
    assertUntouched(before, after, content);
  }
});

test('T-REQ-09-N8 drop leaves a wrong-shape shelf untouched', () => {
  for (const content of CORRUPT_SHAPES) {
    const { before, after } = runOn(content, ['drop', '1']);
    assertUntouched(before, after, content);
  }
});
