// Story 1 rows: add, list, the unknown-command path and the missing, unreadable, corrupt and
// unwritable shelf file for add and list. Top-level test() calls only, so the TAP stays flat.
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

const USAGE_WORDS = ['add', 'list', 'done', 'drop'];
const CORRUPT_JSON = '{"nextId": 1, "books": [';
const CORRUPT_SHAPES = ['[]', '42', '{"nextId": 1}', '{"books": []}'];

const text = (...lines) => (lines.length === 0 ? '' : lines.join('\n') + '\n');
const at = (label) => (label ? `${label}: ` : '');
const dune = () => shelf([book(1, 'to read', 'Dune')]);
const duneAndEmma = () => shelf([book(1, 'to read', 'Dune'), book(2, 'read', 'Emma')]);

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

function assertUsage(r, label = '') {
  for (const word of USAGE_WORDS) {
    assert.ok(r.stderr.includes(word), `${at(label)}usage on stderr lacks "${word}"`);
  }
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

// REQ-01: add a book

test('T-REQ-01-P1 add Dune with no file and with a never-used file', () => {
  withDir((dir) => {
    assertSucceeds(run(['add', 'Dune'], dir), text('added 1 Dune'), 'no shelf.json');
  });
  withDir((dir) => {
    stage(dir, shelf([], 1));
    assertSucceeds(run(['add', 'Dune'], dir), text('added 1 Dune'), 'never-used shelf.json');
  });
});

test('T-REQ-01-P2 second add gets the next id', () => {
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    assertSucceeds(run(['add', 'Emma'], dir), text('added 2 Emma'));
  });
});

test('T-REQ-01-P3 add joins its arguments into the title', () => {
  withDir((dir) => {
    assertSucceeds(run(['add', 'Dune', 'Messiah'], dir), text('added 1 Dune Messiah'));
  });
});

test('T-REQ-01-P4 list shows an added book', () => {
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    assertStdout(run(['list'], dir), text('1 to read Dune'));
  });
});

test('T-REQ-01-P5 the same title twice makes two books', () => {
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    given(['add', 'Dune'], dir);
    assertStdout(run(['list'], dir), text('1 to read Dune', '2 to read Dune'));
  });
});

test('T-REQ-01-P6 an id taken by a dropped book is not reused', () => {
  withDir((dir) => {
    stage(dir, shelf([book(1, 'to read', 'Dune'), book(2, 'to read', 'Emma')], 4));
    assertSucceeds(run(['add', 'X'], dir), text('added 4 X'));
  });
});

test('T-REQ-01-P8 ids stay above any used before when the shelf was emptied', () => {
  withDir((dir) => {
    stage(dir, shelf([], 3));
    assertSucceeds(run(['list'], dir), '', 'list');
    assertSucceeds(run(['add', 'Ulysses'], dir), text('added 3 Ulysses'), 'add');
  });
});

test('T-REQ-01-P10 add creates shelf.json', () => {
  withDir((dir) => {
    assertStatus(run(['add', 'Dune'], dir), 0);
    assert.ok(bytes(dir) !== null, 'shelf.json does not exist after add');
  });
});

test('T-REQ-01-P11 the title is trimmed', () => {
  withDir((dir) => {
    assertStdout(run(['add', '  Dune '], dir), text('added 1 Dune'), 'add');
    assertStdout(run(['list'], dir), text('1 to read Dune'), 'list');
  });
});

test('T-REQ-01-N1 add with no title is refused', () => {
  withDir((dir) => {
    stage(dir, dune());
    assertRefused(run(['add'], dir), 2);
    assertStdout(run(['list'], dir), text('1 to read Dune'), 'list');
  });
});

test('T-REQ-01-N2 add with an empty title is refused', () => {
  withDir((dir) => {
    stage(dir, dune());
    assertRefused(run(['add', ''], dir), 2);
    assertStdout(run(['list'], dir), text('1 to read Dune'), 'list');
  });
});

test('T-REQ-01-N3 add with a blank title is refused', () => {
  withDir((dir) => {
    stage(dir, dune());
    assertRefused(run(['add', '   '], dir), 2);
    assertStdout(run(['list'], dir), text('1 to read Dune'), 'list');
  });
});

test('T-REQ-01-N4 an empty title beats a corrupt file', () => {
  const { r, before, after } = runOn(CORRUPT_JSON, ['add', '']);
  assertRefused(r, 2);
  assertUntouched(before, after);
});

test('T-REQ-01-N5 a missing title beats a corrupt file', () => {
  const { r, before, after } = runOn(CORRUPT_JSON, ['add']);
  assertRefused(r, 2);
  assertUntouched(before, after);
});

test('T-REQ-01-N6 add leaves only shelf.json behind', () => {
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    given(['add', 'Emma'], dir);
    assert.deepEqual(listing(dir), ['shelf.json'], 'the directory does not hold only shelf.json');
  });
});

test('T-REQ-01-N7 add stores nothing but the known values', () => {
  const allowed = [1, 2, 3, 'to read', 'Dune', 'Emma'];
  const found = [];
  const walk = (value, where) => {
    if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${where}[${index}]`));
    else if (value !== null && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, `${where}.${key}`);
    } else found.push([where, value]);
  };
  withDir((dir) => {
    given(['add', 'Dune'], dir);
    given(['add', 'Emma'], dir);
    const stored = bytes(dir);
    assert.ok(stored !== null, 'shelf.json does not exist');
    walk(JSON.parse(stored.toString('utf8')), 'shelf');
  });
  for (const [where, value] of found) {
    assert.ok(allowed.includes(value), `unexpected value at ${where}: ${JSON.stringify(value)}`);
  }
});

test('T-REQ-01-N8 command words in a title are title text', () => {
  withDir((dir) => {
    assertSucceeds(run(['add', 'drop', '1'], dir), text('added 1 drop 1'), 'add drop 1');
    assertSucceeds(run(['add', 'list'], dir), text('added 2 list'), 'add list');
    assertStdout(run(['list'], dir), text('1 to read drop 1', '2 to read list'), 'list');
  });
});

// REQ-02: list the books

test('T-REQ-02-P1 list prints each book', () => {
  const { r } = runOn(duneAndEmma(), ['list']);
  assertStdout(r, text('1 to read Dune', '2 read Emma'));
});

test('T-REQ-02-P2 list is in ascending id order', () => {
  const books = [book(3, 'read', 'Ulysses'), book(1, 'read', 'Dune'), book(2, 'to read', 'Emma')];
  const { r } = runOn(shelf(books), ['list']);
  assertStdout(r, text('1 read Dune', '2 to read Emma', '3 read Ulysses'));
});

test('T-REQ-02-P4 list exits 0', () => {
  const { r } = runOn(dune(), ['list']);
  assertStatus(r, 0);
});

test('T-REQ-02-P5 each directory lists its own shelf', () => {
  withDir((first) =>
    withDir((second) => {
      stage(first, dune());
      stage(second, shelf([book(1, 'to read', 'Emma'), book(2, 'read', 'Ulysses')]));
      assertStdout(run(['list'], first), text('1 to read Dune'), 'first directory');
      const want = text('1 to read Emma', '2 read Ulysses');
      assertStdout(run(['list'], second), want, 'second directory');
    }),
  );
});

test('T-REQ-02-P6 list ignores an extra argument', () => {
  withDir((dir) => {
    stage(dir, duneAndEmma());
    const want = text('1 to read Dune', '2 read Emma');
    assertSucceeds(run(['list', 'x'], dir), want, 'list x');
    assertSucceeds(run(['list'], dir), want, 'list');
  });
});

test('T-REQ-02-N1 list of an empty shelf prints nothing', () => {
  const { r } = runOn(shelf([]), ['list']);
  assertSucceeds(r, '');
});

test('T-REQ-02-N2 list leaves shelf.json untouched', () => {
  const { before, after } = runOn(duneAndEmma(), ['list']);
  assertUntouched(before, after);
});

// REQ-05: refuse an unknown command

test('T-REQ-05-P1 an unknown word is refused with usage', () => {
  withDir((dir) => {
    const r = run(['frobnicate'], dir);
    assertRefused(r, 2);
    assertUsage(r);
  });
});

test('T-REQ-05-P2 no word is refused with usage', () => {
  withDir((dir) => {
    const r = run([], dir);
    assertRefused(r, 2);
    assertUsage(r);
  });
});

test('T-REQ-05-P3 search and rate are refused with usage', () => {
  withDir((dir) => {
    for (const args of [['search', 'x'], ['rate', '1', '5']]) {
      const r = run(args, dir);
      assertRefused(r, 2, args.join(' '));
      assertUsage(r, args.join(' '));
    }
  });
});

test('T-REQ-05-N1 an unknown word leaves shelf.json untouched', () => {
  const { before, after } = runOn(dune(), ['frobnicate']);
  assertUntouched(before, after);
});

test('T-REQ-05-N2 an unknown word beats a corrupt file', () => {
  const { r, before, after } = runOn(CORRUPT_JSON, ['frobnicate']);
  assertRefused(r, 2);
  assertUsage(r);
  assertUntouched(before, after);
});

test('T-REQ-05-N3 help, --help, --version and rm are not commands', () => {
  for (const word of ['help', '--help', '--version', 'rm']) {
    const onShelf = runOn(dune(), [word]);
    assertRefused(onShelf.r, 2, `${word} on a shelf`);
    assertUsage(onShelf.r, `${word} on a shelf`);
    assertUntouched(onShelf.before, onShelf.after, `${word} on a shelf`);
    withDir((dir) => {
      const r = run([word], dir);
      assertRefused(r, 2, `${word} in an empty directory`);
      assertUsage(r, `${word} in an empty directory`);
      assert.deepEqual(listing(dir), [], `${word}: the empty directory is not empty`);
    });
  }
});

// REQ-06: a missing shelf file is an empty shelf

test('T-REQ-06-P1 list with no shelf.json prints nothing', () => {
  const { r } = runOn(null, ['list']);
  assertSucceeds(r, '');
});

test('T-REQ-06-N1 list with no shelf.json creates nothing', () => {
  withDir((dir) => {
    run(['list'], dir);
    assert.deepEqual(listing(dir), [], 'the directory is not empty after list');
  });
});

test('T-REQ-06-N4 an empty title with no shelf.json creates no file', () => {
  const { r, after } = runOn(null, ['add', '']);
  assertRefused(r, 2);
  assert.equal(after, null, 'shelf.json was created');
});

test('T-REQ-06-N6 an unknown word with no shelf.json creates no file', () => {
  const { r, after } = runOn(null, ['frobnicate']);
  assertRefused(r, 2);
  assertUsage(r);
  assert.equal(after, null, 'shelf.json was created');
});

// REQ-07: refuse an unreadable shelf file

test('T-REQ-07-P1 list of an unreadable shelf is refused', () => {
  assertRefused(runUnreadable(['list']).r, 1);
});

test('T-REQ-07-P2 add to an unreadable shelf is refused', () => {
  assertRefused(runUnreadable(['add', 'Dune']).r, 1);
});

test('T-REQ-07-N1 list leaves an unreadable shelf untouched', () => {
  const { before, after } = runUnreadable(['list']);
  assertUntouched(before, after);
});

test('T-REQ-07-N2 add leaves an unreadable shelf untouched', () => {
  const { before, after } = runUnreadable(['add', 'Dune']);
  assertUntouched(before, after);
});

// REQ-08: refuse when the shelf file cannot be written

test('T-REQ-08-P1 add to an unwritable shelf is refused', () => {
  assertRefused(runUnwritable(['add', 'Ulysses'], 'file').r, 1, 'read-only file');
  assertRefused(runUnwritable(['add', 'Ulysses'], 'dir').r, 1, 'read-only directory');
});

test('T-REQ-08-N1 add changes nothing on disk when the shelf is unwritable', () => {
  for (const [variant, label] of [
    ['file', 'read-only file'],
    ['dir', 'read-only directory'],
  ]) {
    const result = runUnwritable(['add', 'Ulysses'], variant);
    assertUntouched(result.before, result.after, label);
    assert.deepEqual(result.listAfter, result.listBefore, `${label}: the directory listing changed`);
  }
});

// REQ-09: refuse a corrupt shelf file

test('T-REQ-09-P1 list of a corrupt shelf is refused', () => {
  assertRefused(runOn(CORRUPT_JSON, ['list']).r, 1);
});

test('T-REQ-09-P2 add to a corrupt shelf is refused', () => {
  assertRefused(runOn(CORRUPT_JSON, ['add', 'Dune']).r, 1);
});

test('T-REQ-09-P5 list of a wrong-shape shelf is refused', () => {
  for (const content of CORRUPT_SHAPES) {
    assertRefused(runOn(content, ['list']).r, 1, content);
  }
});

test('T-REQ-09-P6 add to a wrong-shape shelf is refused', () => {
  for (const content of CORRUPT_SHAPES) {
    assertRefused(runOn(content, ['add', 'Dune']).r, 1, content);
  }
});

test('T-REQ-09-N1 list leaves a corrupt shelf untouched', () => {
  const { before, after } = runOn(CORRUPT_JSON, ['list']);
  assertUntouched(before, after);
});

test('T-REQ-09-N2 add leaves a corrupt shelf untouched', () => {
  const { before, after } = runOn(CORRUPT_JSON, ['add', 'Dune']);
  assertUntouched(before, after);
});

test('T-REQ-09-N5 list leaves a wrong-shape shelf untouched', () => {
  for (const content of CORRUPT_SHAPES) {
    const { before, after } = runOn(content, ['list']);
    assertUntouched(before, after, content);
  }
});

test('T-REQ-09-N6 add leaves a wrong-shape shelf untouched', () => {
  for (const content of CORRUPT_SHAPES) {
    const { before, after } = runOn(content, ['add', 'Dune']);
    assertUntouched(before, after, content);
  }
});
