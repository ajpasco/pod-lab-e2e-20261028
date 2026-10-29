# Story 4 handoff: a reader that closes the pipe early gets nothing on stderr and exit 0 (D-3)

## What was built

One file changed, `app/shelf.mjs`, in the way TD-21 fixes:

- An `error` listener on `process.stdout`, installed before `main` runs, so no write to stdout can
  fail unheard. It is the one new function, `reportStdoutError`.
- A closed pipe, error code `EPIPE`, is the reader stopping early (`list | head -1`,
  `list | true`): the listener does nothing, so stderr stays empty and `process.exitCode` stays at
  the 0 that `main` returned.
- Any other failure to write stdout is still an unclassified failure under TD-11: the listener
  prints `shelf: unexpected error` and the error's stack on stderr and sets `process.exitCode` to 1.
  The two lines of the report are the same two `main` prints for an unclassified failure.

Nothing else moved. The usage text, the table from error kind to exit code, `reportRefusal`, `main`
and the `process.exitCode` line are as story 1 left them. `process.exit()` is still never called.
`app/src/shelf.mjs` and `app/src/store.mjs` are untouched, as are `eval/` and `docs/`.

## What passes

`sh eval/run.sh` from the worktree root exits 0. `eval/report/rows.txt` has 101 lines: 100 `pass`
(T-REQ-02-P7 and the 99 rows of stories 1 to 3) and the one `deferred` line, T-REQ-01-N9 for D-4,
unchanged from main. The verdict run's TAP summary reads `fail 0` with an empty node stderr. The
conventions step (ESLint with `max-lines-per-function` and `complexity`, Prettier, the
forbidden-in-app check, the layout check) passes. Run three times on this machine, green each time.

Every refusal row still passes, so the listener silences the closed pipe and nothing else: a
refusal writes nothing to stdout, so no write error can arise on that path.

## What could not be made to pass

Nothing. No test looked wrong, and no convention needed departing from.

## Notes for the reader

- I did not reproduce the defect by hand with `node app/shelf.mjs list | head -1` in a shell: the
  session's sandbox refused the script that would have done it. The row T-REQ-02-P7 does the same
  thing (reads the first chunk, destroys its end, checks the first line, exit 0, empty stderr and
  the bytes of `shelf.json`), and it passes; the `| true` case is the same code path with the pipe
  closed earlier, and is not separately verified here.
- The non-`EPIPE` branch of the listener is not covered by any row (the eval plan has no row for it;
  it is a recorded default of TD-21). It is four lines and mirrors the unclassified branch in `main`.
- Whether `EPIPE` is reported once or is followed by further write errors does not matter here:
  `main` makes one `write` call, so at most one `error` event fires.
