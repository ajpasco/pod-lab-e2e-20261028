# Story 1 handoff

## What was built

Three files, nothing else under `app/`:

- `app/shelf.mjs`, the boundary. Reads `process.argv`, calls the one rule entry point, writes the
  lines to stdout, maps a `ShelfError` kind to an exit code and a `shelf: ` message on stderr, and
  holds the usage text (all four commands). An error that is not a `ShelfError` of a known kind
  prints `shelf: unexpected error` and the stack, exit 1. Sets `process.exitCode`, never `exit()`.
- `app/src/shelf.mjs`, the rules. `run(args)` checks the command word first (`usage` kind: no word
  gives the usage alone, an unknown word gives `unknown command: <word>` then the usage), then the
  command's own arguments, then touches the store. `add` joins and trims the title, refuses a
  missing (`add needs a title`) or empty (`the title is empty`) one, takes `nextId`, raises it and
  writes. `list` sorts by id and returns `<id> <status> <title>` lines. Commands live in a `Map`
  so story 2 adds `done` and `drop` as two entries. `ShelfError` is re-exported from the store.
- `app/src/store.mjs`, the store, complete. `readShelf()`: `ENOENT` is the empty shelf and creates
  nothing; any other read failure is `unreadable`; invalid JSON is `corrupt`; a parsed document is
  checked for every fault of blueprint section 7 (not an object, `books` not a list, `nextId` not a
  positive integer, a malformed book, two books sharing an id, `nextId` not above every id) with the
  fixed phrase. Fields shelf did not write are ignored on read and dropped on rewrite.
  `writeShelf()`: `accessSync` `W_OK` on an existing file, write to `.shelf.json.tmp`, `renameSync`
  over `shelf.json`; any failure removes the temporary file and is `unwritable`. Two-space JSON
  with a trailing newline, fields in the order `nextId`, `books`, and `id`, `status`, `title`.

## What passes

`sh eval/run.sh` exits 0 on this machine (macOS, Node 22.23.2, non-root, so the permission rows
staged and ran). `eval/report/rows.txt` holds 48 `pass` lines and no `fail`: the 31 rows of
`eval/stories/1.expect` and the 17 that already passed. The conventions step passed: ESLint,
Prettier, the forbidden-in-app check and the layout check.

Checked by hand, since no row verifies wording: the usage text, `unknown command: <word>`,
`add needs a title`, `the title is empty`, the two corrupt messages and the fault phrases, and
that an extra field in a staged file is dropped on rewrite. The unreadable and unwritable messages
carry the error code (`EACCES`), which the permission rows exercised at exit 1.

## Nothing left failing

No row fails. Nothing in `eval/` or `docs/` was touched.

## Notes

- The brief says the run needs Docker. `eval/run.sh` runs Node directly and never calls Docker;
  Docker was installed here but unused. On a root runner the six permission rows of this story
  would fail at staging (`cannot stage: running as root`), as the eval plan section 8 records.
- No convention was departed from. The blueprint's phrase "no classes except the one error class"
  is followed: `ShelfError` is the only class.
- `run()` in the rules returns the stdout lines rather than printing, so the boundary alone
  touches `process` and `console`, as the ESLint `no-restricted-globals` rule for `app/src/`
  requires.
