# Story 3 handoff: a refused write changes nothing when two commands run at once (D-2)

## What was built

One file changed, `app/src/store.mjs`, in the two places the brief and TD-20 name:

- The temporary file the write path uses is now named for the writing process,
  `.shelf.json.<pid>.tmp`, instead of the shared `.shelf.json.tmp`.
- The process id comes from `node:process` as a named import (`import { pid } from 'node:process'`),
  so the store still imports only `node:` modules and the `no-restricted-globals` rule on the
  `process` global is kept. A named import was chosen over a default import so that no binding
  called `process` exists in the store at all; either form passes the lint rule.

Nothing else in the store moved: the read path, the shape checks, `ShelfError` and its kinds, and
the write method (writability check first, whole document to the temporary file, rename over
`shelf.json`, remove the temporary file and throw `unwritable` on any failure) are as story 1 left
them. `app/shelf.mjs` and `app/src/shelf.mjs` are untouched, as are `eval/` and `docs/`.

## What passes

`sh eval/run.sh` from the worktree root exits 0. `eval/report/rows.txt` has 99 lines, all `pass`:
the new row T-REQ-08-N4 and the 98 rows of stories 1 and 2. The conventions step (ESLint, Prettier,
the forbidden-in-app check, the layout check) passes. Run twice on this machine (macOS, Docker
28.1.1 present); both runs green.

T-REQ-01-N6 and T-REQ-08-N1 to N3 still pass, so no temporary file is left behind after a
successful or a refused write with the new name.

## What could not be made to pass

Nothing. No test looked wrong, and no convention needed departing from.

## Notes for the reader

- The lost update of TD-17 (both `done` commands exit 0, one change overwritten) is still possible
  and is accepted by blueprint section 8; the row does not assert against it and this story does
  not change it.
- The concurrency row is timing-dependent by nature. On this laptop forty trials of the 16 MB shelf
  ran in about nine seconds and passed in both runs. The expectations file `eval/stories/3.expect`
  says the row fails on main before this change, which matches the defect record.
