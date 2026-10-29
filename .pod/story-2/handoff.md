# Story 2 handoff: done and drop

Branch `story/2`, built 2026-10-28.

## What was built

Two files changed, as `eval/stories/2.txt` allows; nothing else touched.

- `app/shelf.mjs` (boundary): the `unknown-id` kind enters the exit-code table at exit 1
  (blueprint section 10, TD-10). Usage text, messages and the other kinds are unchanged.
- `app/src/shelf.mjs` (rules):
  - `parseId(command, args)`: the id check of PRD section 4. A missing id throws
    `argument` with `<command> needs an id`; a string that is not `^[0-9]+$` (so `abc`, `1.5`,
    `-1`, `1a`, `+1`, `""`) throws `argument` with `not a numeric id: <argument>`; otherwise the
    digit string is converted with `Number`, so `007` is 7 (TD-14).
  - `findBook(command, args)`: runs the id check first, then `readShelf()`, so the order of
    checks of TD-4 holds (command word, then id, then file). A numeric id matching no stored id
    throws `unknown-id` with `no book with id <number>`; with no `shelf.json` the empty shelf
    matches nothing, so the same refusal, and nothing is created.
  - `done`: sets the status to `read` and always rewrites the file, including on a book already
    read (TD-13); prints `done <id> <title>`.
  - `drop`: removes the book, leaves `nextId` as it is so the id is never reused; prints
    `dropped <id> <title>`.
  - Both routed in the `COMMANDS` map. Extra arguments after the id are ignored because only
    `args[0]` is read.

`app/src/store.mjs` was not edited. No convention was departed from.

## What passes

`sh eval/run.sh` from the worktree root exits 0. `eval/report/rows.txt` holds 98 `pass` lines
and no `fail` line: the 29 rows of `eval/stories/2.expect`, the 21 story-2 rows that already
passed, and the 48 story-1 rows. The conventions step (ESLint, Prettier, forbidden-in-app,
layout) passed with no finding. Run on macOS with Node v22.23.2 as a non-root user, so the
`chmod` rows (REQ-07, REQ-08) ran for real rather than as a gap.

## What could not be made to pass

Nothing. No row failed and no test is believed wrong.

## Notes for the reader

- Message wording follows the table of blueprint section 10 but is not checked by any row. It
  was verified by reading the code against the table; a scripted hand run in a temporary
  directory was prepared but not executed in this session, so the reader is the check.
- A digit string too long to be an exact integer (for example 23 digits) converts to an inexact
  number, matches no id and is refused as `unknown-id`, as TD-14 says; the message then prints
  the number in JavaScript's form (for example `1e+23`). Not covered by a row and not a
  departure, noted only because the printed number does not echo the argument's digits.
