# Eval plan and stories: shelf

Revision 7.

Written against PRD revision 10 and blueprint revision 11 (revisions after PRD 5 and blueprint 4 changed no requirement, criterion or register row until PRD 10, which added REQ-08 c5, and blueprint 11, which added its register row; PRD 9 and blueprint 10 record increment delta 1, story 2, and PRD 10 and blueprint 11 record increment delta 2, defect D-2, both carried here as section 12). Every `REQ-nn` below is an id
the PRD gave; this plan mints none. `Qn` and `Dn` cite `docs/PREPARATION-STATE.md`; `D-<n>` with a
hyphen is a defect record, `docs/defects/D-<n>.md`.

## 1. Conventions of this plan

**Test ids.** `T-REQ-nn-P<k>` for a positive row, `T-REQ-nn-N<k>` for a negative one. The number is the
PRD's requirement id. Ids are stable and never reused. Each test's title in code starts with its id.

**What P and N mean here.** A row is **P** when it asserts something the application does: a line is
printed, a book is changed, or (for REQ-05, REQ-07, REQ-08 and REQ-09, whose headline outcome is a
refusal) the refusal the requirement names is delivered to the reader. A row is **N** when it asserts
that something does not happen: a book is not added, the file is not changed or created, a command is
not accepted, an argument error beats a file error, or (for REQ-01 to REQ-04 and REQ-06) a bad
argument or an unknown id is refused.

**Kinds.** Every row is `integration`, except four rows of kind `restraint`. No row is `unit`, `e2e`,
`production` or `review`.

**Shorthand used in the Given/When/Then column.**

- **refused (n)**: the process exits with code n, stderr is non-empty and stdout is empty. Per Q14 the
  rows never check the words of stderr, except the usage rows under D11, which also check that the usage
  on stderr contains the four words `add`, `list`, `done` and `drop`.
- **untouched**: the bytes of `shelf.json` equal the bytes staged before the command; when no file was
  staged, there is still no `shelf.json`.
- **listing unchanged**: `shelf list` prints exactly what it printed before the command.
- **a shelf of ...**: the staged `shelf.json`, in the blueprint's section 7 shape, with the next id one
  above the highest id used so far unless the row says otherwise.
- **corrupt (JSON)**: a `shelf.json` that is not valid JSON (a truncated document). **corrupt (shape)**:
  each of four valid-JSON files, one after the other: an array, a number, an object with no books, an
  object with no next id.
- A command written as `add Dune` is `node app/shelf.mjs add Dune`.

**Criteria that list several inputs.** REQ-03 c5 and REQ-04 c5 (five non-numeric ids), REQ-05 c3 (two
commands) and REQ-09 c5 to c8 and c10 (four wrong-shape files) each keep one row with all their inputs
inside it, because the PRD gives them as one criterion. A failure in that row's reason names the input.

**Criteria that name four commands.** REQ-07 c5, REQ-08 c4 (three commands), REQ-09 c9 and REQ-09 c10
are split into one row per command, so `add` and `list` rows belong to story 1 and `done` and `drop`
rows to story 2.

**Rows with a story-1 and a story-2 form.** REQ-01 c6, REQ-01 c7 and REQ-02 c2 involve `drop` or
`done`, which story 1 does not build. Each has a row that stages the state those commands leave behind
(owned by story 1, so story 1 never depends on story 2) and a row that reaches the state with the real
commands (owned by story 2). The real-command form asserts that each `done` or `drop` in its Given
exits 0, so it cannot pass while the command is unknown.

## 2. Commands

Run from the repository root, in this order. Nothing needs a browser or a database.

What must be present: Node 22 (`eval/runtime` holds the single line `node 22`), the `npm` bundled with
it, POSIX `sh` and `grep`, and network access to the npm registry for step 2 when it runs (blueprint Open points 1:
a gate with no registry access cannot run the conventions step). No process in the suite makes a
network request of its own.

```
sh eval/run.sh
```

`eval/run.sh` does, in order:

1. Deletes `eval/report/` and recreates it.

   The guard (below) runs here, before step 2. When `app/` does not exist or holds no `.mjs` file, steps
   2 to 6 are skipped.
2. `npm ci --prefix eval/conventions` (the conventions step, section 3).
3. `eslint --config eval/conventions/eslint.config.mjs app`.
4. `prettier --check --config eval/conventions/prettierrc.json --ignore-path eval/conventions/prettierignore --no-editorconfig app`.
5. `sh eval/conventions/forbidden-in-app.sh`.
6. `sh eval/conventions/layout-check.sh`.
7. The verdict run and the report run (the deferral flow of RUNTIMES.md, "What the gate needs from any
   runner"):
   - The deferred list `eval/deferred.txt` is read before any row runs. A line with a row id and a
     defect id `D-<k>` defers that row; a line with no `D-<k>` defers nothing, and its row runs in the
     verdict run like any other.
   - The verdict run is `node --test --test-reporter=tap eval/tests/*.test.mjs`, with a
     `--test-skip-pattern` for each listed row, matching the whole id, escaped. Its exit status is the
     verdict. Its TAP output is saved under `eval/report/`.
   - A second run, of the listed rows only (`--test-name-pattern`, the whole id escaped), supplies the
     report for them. Its exit status is ignored. Its TAP output is saved under `eval/report/`.
   - In the report a listed row that fails is written `deferred <id> D-<k> <reason>`; one that passes
     is written `pass <id>` (and the gate notes that the list names a passing row); one that is skipped
     is written `fail <id> skipped` and one that did not finish is written `fail <id> did not finish`,
     either of which fails the run.
8. `node eval/tap-to-rows.mjs` converts the saved TAP output into `eval/report/rows.txt`. It writes
   `fail <id> skipped` only for a row skipped inside the verdict run, never for a row left out of it
   by the pattern.
9. Exits non-zero when any line of `rows.txt` starts with `fail`.

**The guard on steps 2 to 6.** `app/` may be absent on main before story 1 (git keeps no empty
directory) or hold no `.mjs` file, and the commands of steps 2 to 6 may then exit non-zero with no files
to check. The guard runs before step 2 (`npm ci`): when `app/` does not exist or holds no `.mjs` file,
`eval/run.sh` prints one line saying the conventions step has nothing to check, skips steps 2 to 6 (the
install, ESLint, Prettier, the forbidden-in-app check and the layout check), and the step passes
(PRACTICES.md section C rule 3). The layout check, when it runs, still refuses any
file under `app/` other than the three of D2. Gate 7 proves this guard by running the suite against the
empty tree.

**How the rows run.** Each row is a `node --test` test whose title starts with its row id. The row
starts `node app/shelf.mjs <args>` as a child process with the working directory set to a fresh
temporary directory, stages `shelf.json` beforehand where its Given needs it (in the blueprint's
section 7 shape; corrupt and wrong-shape files as the PRD lists them), and observes only stdout,
stderr, the exit code and the bytes or presence of files in that directory. No row imports `app/`.
This satisfies coverage rule 5 for every criterion: every row observes the application from outside
its process.

**Files.** `eval/tests/harness.mjs` (spawn, fresh temporary directory, staging, byte comparison,
directory listing, permission staging and restoring) is shared and is not a test file. Tests live in
`eval/tests/story-1.test.mjs`, `eval/tests/story-2.test.mjs` and `eval/tests/story-3.test.mjs`, one
file per story, so a story's rows stay out of main until its packet opens. `eval/stories/` holds each
story's packet files: the scope file `<n>.txt`, the brief `<n>.md` and the expected failures
`<n>.expect` (section 6). Framework: `node --test`, built into Node 22.

**How `rows.txt` is produced.** `eval/tap-to-rows.mjs` reads the TAP reports of step 7. For each test it
takes the id (the first word of the test title) and writes `pass <id>` or `fail <id> <one-line reason>`
(the first line of the test's error, whitespace collapsed). A test skipped inside the verdict run is
written `fail <id> skipped` and fails the run; a row left out of the verdict run by the skip pattern is
never written that way. A listed row (one with a `D-<k>` in `eval/deferred.txt`) is taken from the
second run: if it fails it is written `deferred <id> D-<k> <reason>`; if it passes, `pass <id>`; if it
was skipped, `fail <id> skipped`; if it did not finish, `fail <id> did not finish`. The converter holds the ids of this plan for each story file
that exists under `eval/tests/`; an id in that set that did not appear in the report is written
`fail <id> did not run`. A step that fails after the rows (the `node --test` process exiting non-zero
with every row reported, or a crash outside any test) adds `fail <step> <reason>`. A step that is not
a row (the conventions step, section 3) fails the run before `rows.txt` is written. The file therefore
accounts for every non-zero exit. A deferred row is handled as step 7 states: left out of the verdict
run by `--test-skip-pattern`, whose exit status is the verdict, and reported from a second run of the
listed rows only, whose exit status is ignored.

**Git.** `eval/report/` and `eval/conventions/node_modules/` are ignored by git: `eval/.gitignore` holds
the two lines `report/` and `conventions/node_modules/`. The ignore line is not in the root `.gitignore`,
because the freeze pull request changes nothing outside `docs/` and `eval/`. A run therefore never
leaves either directory in a pull request.

**Permission rows.** The 15 rows of the ten permission criteria (section 8) stage their state with
`chmod` and first prove it took effect: the row's own process tries to read (or, for REQ-08, to write
or create a file in) the staged target; if that succeeds, the runner is root, staging did not work and
the row fails with the reason `cannot stage: running as root`. After the command the row restores
permissions before it compares bytes and before the temporary directory is removed.

## 3. The conventions step (not a row)

It has no test id, no Given/When/Then and no state before the build, and traces to no requirement. It
runs from `eval/run.sh` against `app/` only, before any row, with every tool given its configuration on
the command line. A failure fails the run before `rows.txt` is written. An empty `app/` passes it, and
where `app/` is absent or holds no `.mjs` file the guard of section 2 skips steps 2 to 6 and the step
passes; the rows, not this step, fail by absence. Like every file under `eval/`, it is no builder's to change.

| Tool | Pinned version | Configuration under `eval/conventions/` | Blueprint section that binds it |
|---|---|---|---|
| npm (install with `npm ci --prefix eval/conventions`) | the one bundled with Node 22, not pinned further | `package.json`, `package-lock.json` | Section 13, The conventions step, item 1; TD-3 |
| ESLint, with `@eslint/js` | 9.39.1 and 9.39.1 | `eslint.config.mjs` | Section 13, The conventions step item 2; Limits; Practices (Layering, Limits, Errors, Naming, Comments, Dependencies) |
| Prettier | 3.6.2 | `prettierrc.json`, `prettierignore` | Section 13, The conventions step item 3; Practices (Formatting and lint) |
| The forbidden-in-app check (POSIX `sh`, `grep`) | unpinned system tools, stated as such | `forbidden-in-app.sh`, `forbidden-in-app.txt` | Section 13, The conventions step item 4 |
| The layout check (POSIX `sh`) | unpinned system tool, stated as such | `layout-check.sh` | Section 13, The conventions step item 5; Layout; D2, D5 |

The versions are the blueprint's, chosen without a registry; they are confirmed or replaced at gate 7
when the lockfile is generated, and the exact ESLint invocation is proved by running it (blueprint Open
points 1). The pull request that introduces the step shows it run clean on the `app/` that exists then,
and shows the builder-file test of PRACTICES.md section C rule 2 (a configuration or ignore file planted
in a scratch tree under `app/` does not switch a check off). The step declines types, dependency audit,
secret scan and container lint (blueprint section 13; D9).

## 4. The test table

Story 1 rows are stated against the state "empty `app/`": `node app/shelf.mjs` does not exist, so the
child exits 1, Node's `Cannot find module` is on stderr and stdout is empty. Story 2 rows are stated
against "main with story 1 merged", the moment story 2's packet opens: `done` and `drop` are then
unknown commands (exit 2, usage on stderr, stdout empty, file untouched). Both assume a non-root runner
(section 8, Gaps).

The row is `fails` unless it says `passes`. A `passes` row asserts only what already holds in that state;
the reason is given in the row.

### REQ-01: Add a book

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-01-P1 | Given no `shelf.json` (and, in a second run, a never-used `shelf.json` holding no books), when the reader runs `add Dune`, then stdout is exactly `added 1 Dune` and the exit code is 0 in both runs. (REQ-01 c1) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-01-P2 | Given `add Dune` has just run in an empty directory, when the reader runs `add Emma`, then stdout is exactly `added 2 Emma` and the exit code is 0. (REQ-01 c2) | integration | 1 | fails: the first `add` exits 1 where 0 is expected |
| T-REQ-01-P3 | Given no `shelf.json`, when the reader runs `add Dune Messiah` (two arguments), then stdout is exactly `added 1 Dune Messiah` and the exit code is 0. (REQ-01 c3) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-01-P4 | Given `add Dune` has run in an empty directory, when the reader runs `list`, then stdout is exactly `1 to read Dune`. (REQ-01 c4) | integration | 1 | fails: `add` exits 1 where 0 is expected; `list` prints nothing |
| T-REQ-01-P5 | Given an empty directory, when the reader runs `add Dune` twice (both exit 0) and then `list`, then `list` prints exactly two lines, `1 to read Dune` and `2 to read Dune`: a second book with a different id, not refused. (REQ-01 c5) | integration | 1 | fails: `add` exits 1 where 0 is expected |
| T-REQ-01-P6 | Given a shelf staged as it stands after books 1, 2 and 3 were added and book 3 was dropped (books 1 and 2; the next id still 4), when the reader runs `add X`, then stdout is exactly `added 4 X` and the exit code is 0. (REQ-01 c6) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-01-P7 | Given three books added with three `add` runs, when the reader runs `drop 3` (exit 0 is asserted) and then `add X`, then stdout is exactly `added 4 X` and the exit code is 0. (REQ-01 c6, with the real `drop`) | integration | 2 | fails: `drop 3` exits 2 (unknown command) where 0 is expected |
| T-REQ-01-P8 | Given a shelf staged as it stands after books 1 and 2 were added and both dropped (no books; the next id still 3), when the reader runs `list`, then it prints nothing and exits 0, and when the reader runs `add Ulysses`, then stdout is exactly `added 3 Ulysses` (an id higher than any used before) and the exit code is 0. (REQ-01 c7) | integration | 1 | fails: `list` exits 1 where 0 is expected |
| T-REQ-01-P9 | Given books 1 and 2 added with `add`, when the reader runs `drop 1` and `drop 2` (each exits 0, asserted), then `list` prints nothing, and `add Ulysses` prints exactly `added 3 Ulysses`. (REQ-01 c7, with the real `drop`) | integration | 2 | fails: `drop 1` exits 2 (unknown command) where 0 is expected |
| T-REQ-01-P10 | Given an empty directory with no `shelf.json`, when the reader runs `add Dune`, then the exit code is 0 and a file named `shelf.json` now exists in that directory. (REQ-01 c8) | integration | 1 | fails: exit 1 where 0 is expected; no `shelf.json` is created |
| T-REQ-01-P11 | Given an empty directory, when the reader runs `add "  Dune "` (the title with surrounding spaces), then stdout is exactly `added 1 Dune` and `list` prints exactly `1 to read Dune`. (REQ-01 c12) | integration | 1 | fails: exit 1; stdout is empty where `added 1 Dune` is expected |
| T-REQ-01-N1 | Given a shelf of {1 to read Dune}, when the reader runs `add` with no further argument, then it is refused (2) and `list` prints exactly `1 to read Dune`. (REQ-01 c9) | integration | 1 | fails: exit 1 where 2 is expected |
| T-REQ-01-N2 | Given a shelf of {1 to read Dune}, when the reader runs `add ""`, then it is refused (2) and `list` prints exactly `1 to read Dune`. (REQ-01 c10) | integration | 1 | fails: exit 1 where 2 is expected |
| T-REQ-01-N3 | Given a shelf of {1 to read Dune}, when the reader runs `add "   "`, then it is refused (2) and `list` prints exactly `1 to read Dune`. (REQ-01 c11) | integration | 1 | fails: exit 1 where 2 is expected |
| T-REQ-01-N4 | Given a corrupt (JSON) `shelf.json`, when the reader runs `add ""`, then it is refused (2) (not 1) and `shelf.json` is untouched. (REQ-01 c13) | integration | 1 | fails: exit 1 where 2 is expected |
| T-REQ-01-N5 | Given a corrupt (JSON) `shelf.json`, when the reader runs `add` with no further argument, then it is refused (2) and `shelf.json` is untouched. (REQ-01 c14) | integration | 1 | fails: exit 1 where 2 is expected |
| T-REQ-01-N6 | Restraint, file surface. Given an empty directory, when the reader runs `add Dune` and then `add Emma` (both exit 0), then the directory holds exactly one entry, `shelf.json`: no temporary file, no other file and no subdirectory is left. Traces to what `add` leaves on disk (REQ-01 c8); PRD section 7 non-goals ("use a database"). | restraint | 1 | fails: `add` exits 1; the directory is empty where `shelf.json` is expected |
| T-REQ-01-N7 | Restraint, what `add` stores. Given an empty directory, when the reader runs `add Dune` and `add Emma` (both exit 0), then `shelf.json` parses as JSON and every value in it, at any depth, is one of the known values: the ids `1` and `2`, the next id `3`, the status `to read`, and the titles `Dune` and `Emma`. No other value (no date, no rating, nothing else) is stored anywhere in the document. Traces to REQ-01 (what a book is: id, status, title; PRD section 4 Book); PRD section 7 non-goals ("search, rate, or record dates"). | restraint | 1 | fails: `add` exits 1; `shelf.json` does not exist |
| T-REQ-01-N8 | Restraint, text from data is not a control. Given an empty directory, when the reader runs `add drop 1` and then `add list` (both exit 0), then stdout is exactly `added 1 drop 1` and `added 2 list`, and `list` prints exactly `1 to read drop 1` and `2 to read list`: the words are title text and neither dropped book 1 nor listed anything at the add. Traces to REQ-01 c3 (arguments joined into the title); PRD section 4 Title. | restraint | 1 | fails: `add` exits 1 where 0 is expected |

### REQ-02: List the books

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-02-P1 | Given a shelf of {1 to read Dune; 2 read Emma}, when the reader runs `list`, then stdout is exactly the two lines `1 to read Dune` and `2 read Emma`. (REQ-02 c1) | integration | 1 | fails: stdout is empty where two lines are expected |
| T-REQ-02-P2 | Given a `shelf.json` whose books are stored in the order 3, 1, 2 (3 Ulysses read; 1 Dune read; 2 Emma to read), when the reader runs `list`, then the lines appear in ascending id order: 1, 2, 3. (REQ-02 c2) | integration | 1 | fails: stdout is empty where three lines are expected |
| T-REQ-02-P3 | Given three books added with `add`, when the reader runs `done 3` and `done 1` (each exits 0, asserted) and then `list`, then the lines appear in ascending id order: `1 read ...`, `2 to read ...`, `3 read ...`. (REQ-02 c2, with the real `done`) | integration | 2 | fails: `done 3` exits 2 (unknown command) where 0 is expected |
| T-REQ-02-P4 | Given a shelf of {1 to read Dune}, when the reader runs `list`, then the exit code is 0. (REQ-02 c4) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-02-P5 | Given two directories, one with a shelf of {1 to read Dune} and one with a shelf of {1 to read Emma; 2 read Ulysses}, when the reader runs `list` in each, then each prints the books of its own `shelf.json` only. (REQ-02 c6) | integration | 1 | fails: both directories print nothing |
| T-REQ-02-P6 | Given a shelf of {1 to read Dune; 2 read Emma}, when the reader runs `list x` and `list`, then both exit 0 and both print exactly the same two lines. (REQ-02 c7) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-02-N1 | Given a shelf holding no books, when the reader runs `list`, then stdout is empty and the exit code is 0. (REQ-02 c3) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-02-N2 | Given a shelf of {1 to read Dune; 2 read Emma}, when the reader runs `list`, then `shelf.json` is untouched. (REQ-02 c5) | integration | 1 | passes: the assertion is only that the bytes are unchanged, which holds when the process fails to start |

### REQ-03: Mark a book read

All rows are owned by story 2 and stated against main with story 1 merged. `done` is then an unknown
command: exit 2, usage on stderr, stdout empty, file untouched.

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-03-P1 | Given a shelf of {1 to read Dune; 2 to read Emma}, when the reader runs `done 1`, then stdout is exactly `done 1 Dune`, the exit code is 0, and `list` shows `1 read Dune`. (REQ-03 c1) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-03-P2 | Given a shelf of {1 to read Dune; 2 to read Emma; 3 to read Ulysses}, when the reader runs `done 1` (exit 0, asserted), then `list` shows `2 to read Emma` and `3 to read Ulysses` exactly as before. (REQ-03 c2) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-03-P3 | Given a shelf of {1 read Dune}, when the reader runs `done 1`, then stdout is exactly `done 1 Dune`, the exit code is 0, and `list` still shows `1 read Dune`. (REQ-03 c3) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-03-P4 | Given a shelf of seven to-read books, book 7 titled Ulysses, when the reader runs `done 007`, then stdout is exactly `done 7 Ulysses`, the exit code is 0, and `list` shows book 7 read and books 1 to 6 as they were. (REQ-03 c8) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-03-P5 | Given a shelf of {1 to read Dune; 2 to read Emma}, when the reader runs `done 1 2`, then stdout is exactly `done 1 Dune`, the exit code is 0, and `list` shows `1 read Dune` and `2 to read Emma`. (REQ-03 c9) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-03-N1 | Given a shelf of {1 to read Dune}, when the reader runs `done` with no id, then it is refused (2). (REQ-03 c4) | integration | 2 | passes: unknown command also exits 2 with usage on stderr and nothing on stdout |
| T-REQ-03-N2 | Given a shelf of {1 to read Dune}, when the reader runs `done abc`, `done 1.5`, `done -1`, `done 1a` and `done +1` (five runs, all five inputs in this one row), then each is refused (2). (REQ-03 c5) | integration | 2 | passes: unknown command also exits 2 with usage on stderr and nothing on stdout |
| T-REQ-03-N3 | Given a shelf of {1 to read Dune}, when the reader runs `done 99`, then it is refused (1). (REQ-03 c6) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-03-N4 | Given a shelf of {1 to read Dune}, when the reader runs `done 0`, then it is refused (1). (REQ-03 c7) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-03-N5 | Given a shelf of {1 to read Dune; 2 read Emma}, when the reader runs `done` with no id, then `done abc`, then `done 99`, then `shelf.json` is untouched and `list` prints exactly `1 to read Dune` and `2 read Emma`. (REQ-03 c10) | integration | 2 | passes: the file is untouched and `list` (story 1) prints both books, whatever `done` does |
| T-REQ-03-N6 | Given a corrupt (JSON) `shelf.json`, when the reader runs `done abc`, then it is refused (2) and `shelf.json` is untouched. (REQ-03 c11) | integration | 2 | passes: unknown command exits 2 before any file is read |
| T-REQ-03-N7 | Permission row. Given `shelf.json` made unreadable (the row first proves its own process cannot read it), when the reader runs `done` with no id, then it is refused (2) and `shelf.json` is untouched once permissions are restored. (REQ-03 c12) | integration | 2 | passes: unknown command exits 2 before any file is read (on a root runner it fails: `cannot stage: running as root`) |
| T-REQ-03-N8 | Given a shelf of {1 to read Dune}, when the reader runs `done 007`, then it is refused (1). (REQ-03 c13) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-03-N9 | Given a shelf of {1 to read Dune}, when the reader runs `done ""` (an empty-string id), then it is refused (2). (REQ-03 c14) | integration | 2 | passes: unknown command exits 2 with usage on stderr and nothing on stdout |

### REQ-04: Drop a book

All rows are owned by story 2 and stated against main with story 1 merged.

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-04-P1 | Given a shelf of {1 to read Dune; 2 to read Emma; 3 to read Ulysses}, when the reader runs `drop 2`, then stdout is exactly `dropped 2 Emma`, the exit code is 0, and `list` no longer shows book 2. (REQ-04 c1) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-04-P2 | Given the same shelf, when the reader runs `drop 2` (exit 0, asserted), then `list` shows `1 to read Dune` and `3 to read Ulysses` with their ids, statuses and titles unchanged. (REQ-04 c2) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-04-P3 | Given a shelf of {1 read Dune; 2 to read Emma}, when the reader runs `drop 1` and `drop 2`, then each exits 0 and `list` shows neither book afterwards. (REQ-04 c3) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-04-P4 | Given a shelf of seven books, book 7 titled Ulysses, when the reader runs `drop 007`, then stdout is exactly `dropped 7 Ulysses`, the exit code is 0, and `list` shows books 1 to 6 only. (REQ-04 c8) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-04-P5 | Given a shelf of {1 to read Dune; 2 to read Emma}, when the reader runs `drop 1 2`, then stdout is exactly `dropped 1 Dune`, the exit code is 0, and `list` shows book 2 only. (REQ-04 c9) | integration | 2 | fails: exit 2 where 0 is expected |
| T-REQ-04-N1 | Given a shelf of {1 to read Dune}, when the reader runs `drop` with no id, then it is refused (2). (REQ-04 c4) | integration | 2 | passes: unknown command also exits 2 with usage on stderr and nothing on stdout |
| T-REQ-04-N2 | Given a shelf of {1 to read Dune}, when the reader runs `drop abc`, `drop 1.5`, `drop -1`, `drop 1a` and `drop +1` (five runs, all five inputs in this one row), then each is refused (2). (REQ-04 c5) | integration | 2 | passes: unknown command also exits 2 with usage on stderr and nothing on stdout |
| T-REQ-04-N3 | Given a shelf of {1 to read Dune}, when the reader runs `drop 99`, then it is refused (1). (REQ-04 c6) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-04-N4 | Given a shelf of {1 to read Dune}, when the reader runs `drop 0`, then it is refused (1). (REQ-04 c7) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-04-N5 | Given a shelf of {1 to read Dune; 2 read Emma}, when the reader runs `drop` with no id, then `drop abc`, then `drop 99`, then `shelf.json` is untouched and `list` prints exactly `1 to read Dune` and `2 read Emma`. (REQ-04 c10) | integration | 2 | passes: the file is untouched and `list` (story 1) prints both books, whatever `drop` does |
| T-REQ-04-N6 | Given a corrupt (JSON) `shelf.json`, when the reader runs `drop abc`, then it is refused (2) and `shelf.json` is untouched. (REQ-04 c11) | integration | 2 | passes: unknown command exits 2 before any file is read |
| T-REQ-04-N7 | Given a shelf of {1 to read Dune}, when the reader runs `drop 007`, then it is refused (1). (REQ-04 c12) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-04-N8 | Given a shelf of {1 to read Dune}, when the reader runs `drop ""` (an empty-string id), then it is refused (2). (REQ-04 c13) | integration | 2 | passes: unknown command exits 2 with usage on stderr and nothing on stdout |
| T-REQ-04-N9 | Given a corrupt (JSON) `shelf.json`, when the reader runs `drop` with no id, then it is refused (2) and `shelf.json` is untouched. (REQ-04 c14) | integration | 2 | passes: unknown command exits 2 before any file is read |

### REQ-05: Refuse an unknown command

All rows are owned by story 1 and stated against the empty `app/`.

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-05-P1 | Given any directory, when the reader runs `frobnicate`, then it is refused (2) and the usage on stderr contains the four words `add`, `list`, `done` and `drop`. (REQ-05 c1) | integration | 1 | fails: exit 1 where 2 is expected; stderr lacks the four words |
| T-REQ-05-P2 | Given any directory, when the reader runs the application with no word, then it is refused (2) and the usage on stderr contains the four words `add`, `list`, `done` and `drop`. (REQ-05 c2) | integration | 1 | fails: exit 1 where 2 is expected; stderr lacks the four words |
| T-REQ-05-P3 | Given any directory, when the reader runs `search x` and `rate 1 5` (two runs, both in this one row), then each is refused (2) and the usage on stderr contains the four words `add`, `list`, `done` and `drop`. (REQ-05 c3) | integration | 1 | fails: exit 1 where 2 is expected; stderr lacks the four words |
| T-REQ-05-N1 | Given a shelf of {1 to read Dune}, when the reader runs `frobnicate`, then `shelf.json` is untouched. (REQ-05 c4) | integration | 1 | passes: the assertion is only that the bytes are unchanged, which holds when the process fails to start |
| T-REQ-05-N2 | Given a corrupt (JSON) `shelf.json`, when the reader runs `frobnicate`, then it is refused (2), the usage on stderr contains the four words `add`, `list`, `done` and `drop`, and `shelf.json` is untouched. (REQ-05 c5) | integration | 1 | fails: exit 1 where 2 is expected; stderr lacks the four words |
| T-REQ-05-N3 | Restraint, command surface. Given a shelf of {1 to read Dune} (and, in a second pass, an empty directory), when the reader runs each of `help`, `--help`, `--version` and `rm`, then each is refused (2) with usage on stderr and nothing on stdout, and the usage on stderr contains the four words `add`, `list`, `done` and `drop`, `shelf.json` is untouched, and the empty directory is still empty: the only commands are the four the PRD names. Traces to REQ-05; PRD section 3 ("May not: search or rate") and section 7 non-goals ("search, rate, or record dates"). | restraint | 1 | fails: exit 1 where 2 is expected; stderr lacks the four words |

### REQ-06: Treat a missing shelf file as an empty shelf

Each row runs in an empty directory with no `shelf.json`.

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-06-P1 | Given no `shelf.json`, when the reader runs `list`, then stdout is empty and the exit code is 0. (REQ-06 c1) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-06-N1 | Given no `shelf.json`, when the reader runs `list`, then the directory is still empty. (REQ-06 c2) | integration | 1 | passes: the assertion is only that no file appears, which holds when the process fails to start |
| T-REQ-06-N2 | Given no `shelf.json`, when the reader runs `done 1`, then it is refused (1) and no `shelf.json` is created. (REQ-06 c3) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-06-N3 | Given no `shelf.json`, when the reader runs `drop 1`, then it is refused (1) and no `shelf.json` is created. (REQ-06 c4) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-06-N4 | Given no `shelf.json`, when the reader runs `add ""`, then it is refused (2) and no `shelf.json` is created. (REQ-06 c5) | integration | 1 | fails: exit 1 where 2 is expected |
| T-REQ-06-N5 | Given no `shelf.json`, when the reader runs `done abc`, then it is refused (2) and no `shelf.json` is created. (REQ-06 c6) | integration | 2 | passes: unknown command exits 2 with usage on stderr, nothing on stdout, no file created |
| T-REQ-06-N6 | Given no `shelf.json`, when the reader runs `frobnicate`, then it is refused (2), the usage on stderr contains the four words `add`, `list`, `done` and `drop`, and no `shelf.json` is created. (REQ-06 c7) | integration | 1 | fails: exit 1 where 2 is expected; stderr lacks the four words |

### REQ-07: Refuse an unreadable shelf file

Each row stages a shelf of {1 to read Dune}, removes every permission from `shelf.json` with `chmod`,
and first proves its own process cannot read it (otherwise it fails `cannot stage: running as root`).
Rows c5 restore permission before comparing bytes.

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-07-P1 | Given an unreadable `shelf.json`, when the reader runs `list`, then it is refused (1). (REQ-07 c1) | integration | 1 | passes: exit 1, stderr non-empty (Node's) and stdout empty hold when the process fails to start (root: `cannot stage: running as root`) |
| T-REQ-07-P2 | Given an unreadable `shelf.json`, when the reader runs `add Dune`, then it is refused (1). (REQ-07 c2) | integration | 1 | passes: as T-REQ-07-P1 (root: `cannot stage: running as root`) |
| T-REQ-07-P3 | Given an unreadable `shelf.json`, when the reader runs `done 1`, then it is refused (1). (REQ-07 c3) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-07-P4 | Given an unreadable `shelf.json`, when the reader runs `drop 1`, then it is refused (1). (REQ-07 c4) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-07-N1 | Given an unreadable `shelf.json`, when the reader runs `list` and then permission is restored, then `shelf.json` is untouched. (REQ-07 c5, `list`) | integration | 1 | passes: the assertion is only that the bytes are unchanged (root: `cannot stage: running as root`) |
| T-REQ-07-N2 | As T-REQ-07-N1 for `add Dune`. (REQ-07 c5, `add`) | integration | 1 | passes: as T-REQ-07-N1 (root: `cannot stage: running as root`) |
| T-REQ-07-N3 | As T-REQ-07-N1 for `done 1`. (REQ-07 c5, `done`) | integration | 2 | passes: unknown command leaves the file untouched (root: `cannot stage: running as root`) |
| T-REQ-07-N4 | As T-REQ-07-N1 for `drop 1`. (REQ-07 c5, `drop`) | integration | 2 | passes: unknown command leaves the file untouched (root: `cannot stage: running as root`) |

### REQ-08: Refuse when the shelf file cannot be written

Each row stages a shelf of {1 to read Dune} and runs twice: once with `shelf.json` made read-only, once
with its directory made read-only. In each run the row first proves its own process cannot write there
(write to the file; create a file in the directory); otherwise it fails `cannot stage: running as root`.
Permissions are restored before bytes are compared.

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-08-P1 | Given an unwritable shelf (both variants), when the reader runs `add Ulysses`, then it is refused (1). (REQ-08 c1) | integration | 1 | passes: exit 1, stderr non-empty (Node's) and stdout empty hold when the process fails to start (root: `cannot stage: running as root`) |
| T-REQ-08-P2 | Given an unwritable shelf (both variants), when the reader runs `done 1`, then it is refused (1). (REQ-08 c2) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-08-P3 | Given an unwritable shelf (both variants), when the reader runs `drop 1`, then it is refused (1). (REQ-08 c3) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-08-N1 | Given an unwritable shelf (both variants), when the reader runs `add Ulysses`, then the bytes of `shelf.json` and the directory listing equal what was staged: nothing changed on disk, no temporary file left. (REQ-08 c4, `add`) | integration | 1 | passes: the assertion is only that disk is unchanged (root: `cannot stage: running as root`) |
| T-REQ-08-N2 | As T-REQ-08-N1 for `done 1`. (REQ-08 c4, `done`) | integration | 2 | passes: unknown command changes nothing (root: `cannot stage: running as root`) |
| T-REQ-08-N3 | As T-REQ-08-N1 for `drop 1`. (REQ-08 c4, `drop`) | integration | 2 | passes: unknown command changes nothing (root: `cannot stage: running as root`) |
| T-REQ-08-N4 | Two commands at once; no `chmod`, so it runs as root too. Given a large shelf, {1 to read Dune; 2 to read Emma} followed by 400 more to-read books whose titles are 40,000 characters long (a file of about 16 MB, so that each command's write of it takes milliseconds and two writes started in the same moment overlap on a slow machine too), when the reader starts `done 1` and `done 2` in the same moment (two processes), forty times over with the shelf restaged before each trial, then in every trial `list` afterwards exits 0 (the shelf is whole), a `done` that was refused (non-zero exit) printed nothing on stdout and `list` still shows its book `to read`, and when one or both exited 0 `list` shows at least one of their books `read`. A trial where both exit 0 and one change is lost asserts nothing more (blueprint section 8, TD-17). (REQ-08 c5; D-2; added by section 12, delta 2) | integration | 3 | fails, against main with story 2 merged (`a9c2f92`), where both processes write one shared temporary file: in most trials the `done` that exited 1 with the cannot-write message has its book `read` in `list` (`trial <k>, done <id> exited 1 (…ENOENT…): yet list shows "<id> read <title>" where "<id> to read <title>" is expected`) |

### REQ-09: Refuse a corrupt shelf file

"Corrupt (JSON)" and "corrupt (shape)" are defined in section 1. Rows c5 to c8 and c10 hold the four
wrong-shape files in one row each (as the PRD criterion does).

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-09-P1 | Given a corrupt (JSON) `shelf.json`, when the reader runs `list`, then it is refused (1). (REQ-09 c1) | integration | 1 | passes: exit 1, stderr non-empty (Node's) and stdout empty hold when the process fails to start |
| T-REQ-09-P2 | Given a corrupt (JSON) `shelf.json`, when the reader runs `add Dune`, then it is refused (1). (REQ-09 c2) | integration | 1 | passes: as T-REQ-09-P1 |
| T-REQ-09-P3 | Given a corrupt (JSON) `shelf.json`, when the reader runs `done 1`, then it is refused (1). (REQ-09 c3) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-09-P4 | Given a corrupt (JSON) `shelf.json`, when the reader runs `drop 1`, then it is refused (1). (REQ-09 c4) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-09-P5 | Given each of the four corrupt (shape) files, when the reader runs `list`, then it is refused (1) each time. (REQ-09 c5) | integration | 1 | passes: as T-REQ-09-P1 |
| T-REQ-09-P6 | Given each of the four corrupt (shape) files, when the reader runs `add Dune`, then it is refused (1) each time. (REQ-09 c6) | integration | 1 | passes: as T-REQ-09-P1 |
| T-REQ-09-P7 | Given each of the four corrupt (shape) files, when the reader runs `done 1`, then it is refused (1) each time. (REQ-09 c7) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-09-P8 | Given each of the four corrupt (shape) files, when the reader runs `drop 1`, then it is refused (1) each time. (REQ-09 c8) | integration | 2 | fails: exit 2 where 1 is expected |
| T-REQ-09-N1 | Given a corrupt (JSON) `shelf.json`, when the reader runs `list`, then `shelf.json` is untouched. (REQ-09 c9, `list`) | integration | 1 | passes: the assertion is only that the bytes are unchanged |
| T-REQ-09-N2 | As T-REQ-09-N1 for `add Dune`. (REQ-09 c9, `add`) | integration | 1 | passes: as T-REQ-09-N1 |
| T-REQ-09-N3 | As T-REQ-09-N1 for `done 1`. (REQ-09 c9, `done`) | integration | 2 | passes: unknown command leaves the file untouched |
| T-REQ-09-N4 | As T-REQ-09-N1 for `drop 1`. (REQ-09 c9, `drop`) | integration | 2 | passes: unknown command leaves the file untouched |
| T-REQ-09-N5 | Given each of the four corrupt (shape) files, when the reader runs `list`, then that file is untouched. (REQ-09 c10, `list`) | integration | 1 | passes: the assertion is only that the bytes are unchanged |
| T-REQ-09-N6 | As T-REQ-09-N5 for `add Dune`. (REQ-09 c10, `add`) | integration | 1 | passes: as T-REQ-09-N5 |
| T-REQ-09-N7 | As T-REQ-09-N5 for `done 1`. (REQ-09 c10, `done`) | integration | 2 | passes: unknown command leaves the file untouched |
| T-REQ-09-N8 | As T-REQ-09-N5 for `drop 1`. (REQ-09 c10, `drop`) | integration | 2 | passes: unknown command leaves the file untouched |

For the record, against the empty tree (not the state at which story 2's packet opens), 26 of story 2's
50 rows fail and 24 pass: the rows that expect exit 0, exit 2 or a `list` output fail, and the rows whose
every assertion holds under exit 1, an empty stdout and an unchanged disk pass (T-REQ-03-N3, N4, N8;
T-REQ-04-N3, N4, N7; T-REQ-06-N2, N3; the four REQ-07 and four REQ-08 rows; the eight REQ-09 rows).

## 5. Coverage: every criterion and register row to a row id

All 81 criteria of the PRD and all 81 register rows of blueprint section 4 (same keys) map as follows
(REQ-08 c5 and its row were added by section 12, delta 2).
The restraint rows T-REQ-01-N6, T-REQ-01-N7, T-REQ-01-N8 and T-REQ-05-N3 have no register row; they
trace to the requirement named and to the PRD's non-goals.

| Criterion | Row id(s) | Criterion | Row id(s) |
|---|---|---|---|
| REQ-01 c1 | T-REQ-01-P1 | REQ-05 c1 | T-REQ-05-P1 |
| REQ-01 c2 | T-REQ-01-P2 | REQ-05 c2 | T-REQ-05-P2 |
| REQ-01 c3 | T-REQ-01-P3 | REQ-05 c3 | T-REQ-05-P3 |
| REQ-01 c4 | T-REQ-01-P4 | REQ-05 c4 | T-REQ-05-N1 |
| REQ-01 c5 | T-REQ-01-P5 | REQ-05 c5 | T-REQ-05-N2 |
| REQ-01 c6 | T-REQ-01-P6, T-REQ-01-P7 | REQ-06 c1 | T-REQ-06-P1 |
| REQ-01 c7 | T-REQ-01-P8, T-REQ-01-P9 | REQ-06 c2 | T-REQ-06-N1 |
| REQ-01 c8 | T-REQ-01-P10 | REQ-06 c3 | T-REQ-06-N2 |
| REQ-01 c9 | T-REQ-01-N1 | REQ-06 c4 | T-REQ-06-N3 |
| REQ-01 c10 | T-REQ-01-N2 | REQ-06 c5 | T-REQ-06-N4 |
| REQ-01 c11 | T-REQ-01-N3 | REQ-06 c6 | T-REQ-06-N5 |
| REQ-01 c12 | T-REQ-01-P11 | REQ-06 c7 | T-REQ-06-N6 |
| REQ-01 c13 | T-REQ-01-N4 | REQ-07 c1 | T-REQ-07-P1 |
| REQ-01 c14 | T-REQ-01-N5 | REQ-07 c2 | T-REQ-07-P2 |
| REQ-02 c1 | T-REQ-02-P1 | REQ-07 c3 | T-REQ-07-P3 |
| REQ-02 c2 | T-REQ-02-P2, T-REQ-02-P3 | REQ-07 c4 | T-REQ-07-P4 |
| REQ-02 c3 | T-REQ-02-N1 | REQ-07 c5 | T-REQ-07-N1, N2, N3, N4 (`list`, `add`, `done`, `drop`) |
| REQ-02 c4 | T-REQ-02-P4 | REQ-08 c1 | T-REQ-08-P1 |
| REQ-02 c5 | T-REQ-02-N2 | REQ-08 c2 | T-REQ-08-P2 |
| REQ-02 c6 | T-REQ-02-P5 | REQ-08 c3 | T-REQ-08-P3 |
| REQ-02 c7 | T-REQ-02-P6 | REQ-08 c4 | T-REQ-08-N1, N2, N3 (`add`, `done`, `drop`) |
| REQ-03 c1 | T-REQ-03-P1 | REQ-09 c1 | T-REQ-09-P1 |
| REQ-03 c2 | T-REQ-03-P2 | REQ-09 c2 | T-REQ-09-P2 |
| REQ-03 c3 | T-REQ-03-P3 | REQ-09 c3 | T-REQ-09-P3 |
| REQ-03 c4 | T-REQ-03-N1 | REQ-09 c4 | T-REQ-09-P4 |
| REQ-03 c5 | T-REQ-03-N2 | REQ-09 c5 | T-REQ-09-P5 |
| REQ-03 c6 | T-REQ-03-N3 | REQ-09 c6 | T-REQ-09-P6 |
| REQ-03 c7 | T-REQ-03-N4 | REQ-09 c7 | T-REQ-09-P7 |
| REQ-03 c8 | T-REQ-03-P4 | REQ-09 c8 | T-REQ-09-P8 |
| REQ-03 c9 | T-REQ-03-P5 | REQ-09 c9 | T-REQ-09-N1, N2, N3, N4 (`list`, `add`, `done`, `drop`) |
| REQ-03 c10 | T-REQ-03-N5 | REQ-09 c10 | T-REQ-09-N5, N6, N7, N8 (`list`, `add`, `done`, `drop`) |
| REQ-03 c11 | T-REQ-03-N6 | REQ-04 c1 | T-REQ-04-P1 |
| REQ-03 c12 | T-REQ-03-N7 | REQ-04 c2 | T-REQ-04-P2 |
| REQ-03 c13 | T-REQ-03-N8 | REQ-04 c3 | T-REQ-04-P3 |
| REQ-03 c14 | T-REQ-03-N9 | REQ-04 c4 | T-REQ-04-N1 |
| REQ-04 c5 | T-REQ-04-N2 | REQ-04 c9 | T-REQ-04-P5 |
| REQ-04 c6 | T-REQ-04-N3 | REQ-04 c10 | T-REQ-04-N5 |
| REQ-04 c7 | T-REQ-04-N4 | REQ-04 c11 | T-REQ-04-N6 |
| REQ-04 c8 | T-REQ-04-P4 | REQ-04 c12 | T-REQ-04-N7 |
| REQ-04 c13 | T-REQ-04-N8 | REQ-04 c14 | T-REQ-04-N9 |
| REQ-08 c5 | T-REQ-08-N4 | | |

## 6. Stories

| Story | Owns these files | Depends on | Tests it must turn green |
|---|---|---|---|
| 1 | Creates `app/shelf.mjs`, `app/src/shelf.mjs`, `app/src/store.mjs` | nothing (main has an empty `app/`) | The 48 story-1 rows below: every row for `add`, `list`, the unknown-command path, and the missing, unreadable, corrupt and unwritable file for `add` and `list` |
| 2 | Edits to `app/shelf.mjs` and `app/src/shelf.mjs` only; never `app/src/store.mjs` | Story 1: it edits the two files story 1 creates, and its rows use story 1's `add` and `list` | The 50 story-2 rows below: every `done` and `drop` row |
| 3 | Edits to `app/src/store.mjs` only; never `app/shelf.mjs` or `app/src/shelf.mjs` (section 12, delta 2) | Stories 1 and 2, both merged: it edits the file story 1 created, and its row uses story 2's `done` and story 1's `list` | The 1 story-3 row below: T-REQ-08-N4 |

Every row has exactly one owner story. No story-1 row uses `done` or `drop`. The scope is not disjoint
in the strict sense of the rubric: stories 1 and 2 both name `app/shelf.mjs` and `app/src/shelf.mjs`,
story 1 to create them and story 2 to edit them afterwards. This is the blueprint's section 9 design
(the store is complete in story 1 so that story 2 never edits it) and the user's stated scope. The user
accepted create-then-edit as a recorded limitation (D10); story 2's scope file (`eval/stories/2.txt`)
names only `app/shelf.mjs` and `app/src/shelf.mjs`. Story 3 is an increment in sequence after both
merged, so the disjoint-scope rule, which is for stories built in parallel, does not apply to its
editing a file story 1 created (INCREMENT.md section 3, item 5).

**Packet files.** Story 1: `eval/stories/1.txt` (its scope file, listing `app/shelf.mjs`,
`app/src/shelf.mjs`, `app/src/store.mjs`), `eval/stories/1.md` (its brief, written at gate 7 from this
section) and `eval/stories/1.expect` (the list in this section). Story 2: `eval/stories/2.txt` (listing
`app/shelf.mjs` and `app/src/shelf.mjs`), `eval/stories/2.md` and `eval/stories/2.expect`, shipped with
story 2's packet after story 1 merges (section 12, delta 1). Story 3: `eval/stories/3.txt` (listing
`app/src/store.mjs`), `eval/stories/3.md` and `eval/stories/3.expect` (one line), shipped with the
D-2 packet after story 2 merges (section 12, delta 2).

**Story 1 rows (48).**
T-REQ-01-P1, P2, P3, P4, P5, P6, P8, P10, P11; T-REQ-01-N1 to N8;
T-REQ-02-P1, P2, P4, P5, P6; T-REQ-02-N1, N2;
T-REQ-05-P1 to P3; T-REQ-05-N1 to N3;
T-REQ-06-P1, N1, N4, N6;
T-REQ-07-P1, P2, N1, N2;
T-REQ-08-P1, N1;
T-REQ-09-P1, P2, P5, P6, N1, N2, N5, N6.

**Story 2 rows (50).**
T-REQ-01-P7, P9; T-REQ-02-P3;
T-REQ-03-P1 to P5, N1 to N9; T-REQ-04-P1 to P5, N1 to N9;
T-REQ-06-N2, N3, N5;
T-REQ-07-P3, P4, N3, N4;
T-REQ-08-P2, P3, N2, N3;
T-REQ-09-P3, P4, P7, P8, N3, N4, N7, N8.

### `eval/stories/1.expect` (31 rows: story 1 against the empty `app/`)

```
fail T-REQ-01-P1
fail T-REQ-01-P2
fail T-REQ-01-P3
fail T-REQ-01-P4
fail T-REQ-01-P5
fail T-REQ-01-P6
fail T-REQ-01-P8
fail T-REQ-01-P10
fail T-REQ-01-P11
fail T-REQ-01-N1
fail T-REQ-01-N2
fail T-REQ-01-N3
fail T-REQ-01-N4
fail T-REQ-01-N5
fail T-REQ-01-N6
fail T-REQ-01-N7
fail T-REQ-01-N8
fail T-REQ-02-P1
fail T-REQ-02-P2
fail T-REQ-02-P4
fail T-REQ-02-P5
fail T-REQ-02-P6
fail T-REQ-02-N1
fail T-REQ-05-P1
fail T-REQ-05-P2
fail T-REQ-05-P3
fail T-REQ-05-N2
fail T-REQ-05-N3
fail T-REQ-06-P1
fail T-REQ-06-N4
fail T-REQ-06-N6
```

Story 1 `passes` rows (17, not listed in the expect file): T-REQ-02-N2, T-REQ-05-N1, T-REQ-06-N1,
T-REQ-07-P1, T-REQ-07-P2, T-REQ-07-N1, T-REQ-07-N2, T-REQ-08-P1, T-REQ-08-N1, T-REQ-09-P1, P2, P5, P6,
N1, N2, N5, N6. None is a `cannot run` row: every row can run against the empty tree.

### `eval/stories/2.expect` (29 rows: story 2 against main with story 1 merged)

```
fail T-REQ-01-P7
fail T-REQ-01-P9
fail T-REQ-02-P3
fail T-REQ-03-P1
fail T-REQ-03-P2
fail T-REQ-03-P3
fail T-REQ-03-P4
fail T-REQ-03-P5
fail T-REQ-03-N3
fail T-REQ-03-N4
fail T-REQ-03-N8
fail T-REQ-04-P1
fail T-REQ-04-P2
fail T-REQ-04-P3
fail T-REQ-04-P4
fail T-REQ-04-P5
fail T-REQ-04-N3
fail T-REQ-04-N4
fail T-REQ-04-N7
fail T-REQ-06-N2
fail T-REQ-06-N3
fail T-REQ-07-P3
fail T-REQ-07-P4
fail T-REQ-08-P2
fail T-REQ-08-P3
fail T-REQ-09-P3
fail T-REQ-09-P4
fail T-REQ-09-P7
fail T-REQ-09-P8
```

Story 2 `passes` rows (21, not listed): T-REQ-03-N1, N2, N5, N6, N7, N9; T-REQ-04-N1, N2, N5, N6, N8, N9;
T-REQ-06-N5; T-REQ-07-N3, N4; T-REQ-08-N2, N3; T-REQ-09-N3, N4, N7, N8.

**Story 3 rows (1).** T-REQ-08-N4.

### `eval/stories/3.expect` (1 row: story 3 against main with story 2 merged)

```
fail T-REQ-08-N4
```

Story 3 has no `passes` row and retires no row, so there is no `eval/stories/3.retire`.

**On a runner that is root.** Both files assume a non-root runner. As root, the 15 permission rows fail
`cannot stage: running as root`. That adds, to story 1, the six rows T-REQ-07-P1, P2, N1, N2 and
T-REQ-08-P1, N1; and to story 2, the five rows T-REQ-03-N7, T-REQ-07-N3, N4 and T-REQ-08-N2, N3 (the
other four permission rows of story 2 already fail). The preview would then name them as unexpected
failures until the founder defers them (section 8).

## 7. Counts

Rows per requirement. "Fail S1" is the number of that requirement's story-1 rows expected to fail
against the empty `app/`; "Fail S2" the story-2 rows expected to fail against story-1 main; "Fail S3"
the story-3 rows expected to fail against story-2 main (section 12, delta 2).

| Requirement | P | N | Integration | Restraint | Total | Fail S1 | Fail S2 | Fail S3 |
|---|---|---|---|---|---|---|---|---|
| REQ-01 | 11 | 8 | 16 | 3 | 19 | 17 | 2 | 0 |
| REQ-02 | 6 | 2 | 8 | 0 | 8 | 6 | 1 | 0 |
| REQ-03 | 5 | 9 | 14 | 0 | 14 | 0 | 8 | 0 |
| REQ-04 | 5 | 9 | 14 | 0 | 14 | 0 | 8 | 0 |
| REQ-05 | 3 | 3 | 5 | 1 | 6 | 5 | 0 | 0 |
| REQ-06 | 1 | 6 | 7 | 0 | 7 | 3 | 2 | 0 |
| REQ-07 | 4 | 4 | 8 | 0 | 8 | 0 | 2 | 0 |
| REQ-08 | 3 | 4 | 7 | 0 | 7 | 0 | 2 | 1 |
| REQ-09 | 8 | 8 | 16 | 0 | 16 | 0 | 4 | 0 |
| **Total** | **46** | **53** | **95** | **4** | **99** | **31** | **29** | **1** |

Overall: 99 rows (46 positive, 53 negative); 95 `integration`, 4 `restraint`, no `unit`, `e2e`,
`production` or `review`. Per story: story 1 has 48 rows (31 fail, 17 pass); story 2 has 50 rows (29
fail, 21 pass); story 3 has 1 row (1 fail, 0 pass); 61 rows fail before their story and 38 pass. The
99 rows are the 81 criteria (one row each), plus 11 rows from the four splits (REQ-07 c5 into 4 rows,
REQ-08 c4 into 3, REQ-09 c9 and c10 into 4 each: 15 rows for 4 criteria), plus 3 rows for the
real-command forms (T-REQ-01-P7, P9, T-REQ-02-P3), plus 4 restraint rows: 81 + 11 + 3 + 4 = 99.

## 8. Gaps

- **Permission rows on a gate that runs as root (Q10 for REQ-08; blueprint section 4 and Open points 2
  for the rest).** The ten criteria
  REQ-07 c1 to c5, REQ-08 c1 to c4 and REQ-03 c12 are 15 rows after the splits: T-REQ-07-P1 to P4 and
  N1 to N4, T-REQ-08-P1 to P3 and N1 to N3, and T-REQ-03-N7. On a gate that runs as root, `chmod` has no
  effect, so each of the 15 rows fails with the reason `cannot stage: running as root`; it never passes.
  This is a recorded gap: those criteria are not proved on such a gate. The handling of REQ-08 c1 to c4
  as a gap is the user's direction (Q10: if the test cannot run on the gate's machine, the plan records
  it as a gap). Its extension to REQ-07 c1 to c5 and REQ-03 c12 is a recorded default of the blueprint
  (TECH-SPEC section 4 and Open points 2), not Q10's words. The founder may
  defer them through `eval/deferred.txt` with a defect id (the deferral is then the recorded gap's
  evidence). On GitHub's hosted Linux runner, which is non-root, the rows run as written. Which kind of
  gate machine the project uses is Open point 6, answered in the gate 6 decisions file.
- **No network connection (restraint; PRD section 7 non-goals "web app or a server").** No row asserts
  that shelf makes no network connection: the check cannot be stated as an outcome observable from stdout,
  stderr, the exit code and the files in the directory. It is held by the conventions step's import
  rules (blueprint section 13) in part only: they bar any import that is neither `node:` nor relative,
  and they keep the boundary and the rules layer to relative imports, but a `node:` network module in
  the store, or a global such as `fetch`, is not refused by a tool. The remainder is held by the fresh
  reader at review.
- **Wording of messages and usage (Q14, D11).** Rows check that stderr is non-empty, and otherwise not
  its words. The four-command part of REQ-05 c1, c2, c3, c5 and REQ-06 c7 (the usage "lists the four
  commands", PRD section 4 Usage) is now asserted: those rows check that the usage on stderr contains
  `add`, `list`, `done` and `drop` (D11). The rest of the wording, the messages and the rest of the
  usage text, stays with the fresh reader against the blueprint's section 10 table, not a row.
- **Accepted limitations (D6, D7; blueprint section 11).** A title with a newline or control characters,
  and the absence of a `shelf` command on the path, need no row: the PRD states nothing about them.
- **Blueprint decisions with no PRD criterion.** Fields not written by shelf being dropped on rewrite
  (Q18 item 5), last write wins (TD-17) and the write method (TD-8, TD-20) have no criterion and no
  row. Since delta 2 (section 12), the one consequence of two commands at once that the PRD does
  state, REQ-08 c5, has its row, T-REQ-08-N4; that one of two successful changes may be lost (TD-17)
  is still no criterion and no row asserts it either way.
- **Non-functional requirements.** "Runs on Node 22" is held by `eval/runtime` and the suite running on it,
  and "No dependencies" by the layout check and the import rule of the conventions step. They are not
  acceptance criteria and have no row.
- **Order of checks.** The PRD says the rule holds for every combination and its criteria sample it
  (Q15). The plan's rows test those samples only.

No acceptance criterion is without a row.

## 9. Untestable as written

None. D11 resolved the one qualification of revision 1: the Usage definition (PRD section 4) is now
testable, because Q14 was narrowed to allow a row to check that the usage on stderr contains `add`,
`list`, `done` and `drop`.

## 10. Open points

1. **Pinned versions** (ESLint, `@eslint/js` 9.39.1; Prettier 3.6.2) and the exact ESLint invocation
   are confirmed or replaced at gate 7 (blueprint Open points 1). A gate with no npm registry access
   cannot run the conventions step.
2. **Shared files between the stories.** Closed by D10 (section 6).
3. **How a gap shows in a run** (blueprint Open points 2): this plan makes the ten permission criteria
   fail with `cannot stage: running as root` and leaves deferral to the founder; `rows.txt` has no
   entry for "cannot run".
4. **Where the converter takes the expected row ids.** RUNTIMES.md and the eval plan rubric require `fail <id> did not
   run`; this plan has `eval/tap-to-rows.mjs` hold the ids of this plan per story file present under
   `eval/tests/`, so that main before story 2's packet is not blamed for story 2's rows. That
   choice is the plan's, not an input's.
5. **Passing rows before the build.** 38 rows pass before their story is built (section 6), because
   their every assertion holds when the process fails or does something else harmless. These
   are the criteria that say only that a file is untouched or that a refusal appears with exit 1 or 2.
   After the build they are real evidence; before it they show nothing. Nothing in the inputs allows
   strengthening them without asserting wording or implementation.
6. **Whether the gate's machine runs as root.** The gate workflow in this repository runs on GitHub's
   hosted `ubuntu-latest` runner with no container, which is non-root, so the 15 permission rows run as
   written and both `.expect` lists hold. The founder's answer on this is recorded in the gate 6 decisions
   file, `docs/decisions-2026-10-28.md`, which this plan cites as a source once it exists.

## 11. Change log

- **Revision 1.** First draft for gate 5: 98 rows, two stories, the commands, the conventions step, the
  coverage map, gaps and counts.
- **Revision 2.**
  - G5-B-01: T-REQ-01-N7 now asserts what is stored (every value in `shelf.json`, at any depth, is a
    known value), not the shape of the file.
  - G5-A-01: section 2 states the deferral flow of RUNTIMES.md in full (deferred list read first; verdict
    run with `--test-skip-pattern`; report run with `--test-name-pattern`, exit status ignored; the
    `deferred`, `pass` and `fail` lines; a line with no `D-<k>` defers nothing; `fail <id> skipped` only
    for a row skipped inside the verdict run), and the `rows.txt` paragraph agrees.
  - G5-A-02: T-REQ-01-P8's Then now also asserts that `list` exits 0, so its stated reason holds.
  - D10: section 6 records the accepted create-then-edit limitation and story 2's scope file; Open point 2
    is closed.
  - D11: the usage rows T-REQ-05-P1, P2, P3, N2, N3 and T-REQ-06-N6 assert that the usage on stderr
    contains `add`, `list`, `done` and `drop`; sections 1, 8 and 9 amended. No row added or removed; both
    `.expect` lists unchanged.
- **Revision 3.** Every `fail` line of the deferral flow carries a reason (G5-2-A-02); the
  header names the PRD and blueprint revisions.
- **Revision 4.** Corrections from the gate 6 review: R6-001, R6-003, R6-004, R6-005, R6-006.
  - R6-001: sections 2 and 3 state the guard on steps 3 to 6 for an `app/` that is absent or holds no
    `.mjs` file; gate 7 proves it against the empty tree.
  - R6-003: section 8 credits Q10 for REQ-08 only and names the extension to REQ-07 and REQ-03 c12 as the
    blueprint's recorded default.
  - R6-004: section 2 records that `eval/conventions/node_modules/` is ignored by git.
  - R6-005: section 6 names each story's packet files; section 2 says `eval/stories/` holds them.
  - R6-006: the header drops "(draft for gate 5)"; Open point 4 now cites RUNTIMES.md and the eval plan
    rubric.
  - No row, state, count or `.expect` list changed.
- **Revision 5.** Corrections from the second gate 6 review: R62-001, R62-002, R62-003, R62-004.
  - R62-001: the guard runs before step 2 and skips steps 2 to 6 (install, ESLint, Prettier, the
    forbidden-in-app check, the layout check); the step list, the guard paragraph, section 3 and the
    network sentence agree.
  - R62-002: the ignore line for `eval/conventions/node_modules/` is in `eval/.gitignore`, not the root
    `.gitignore`, because the freeze pull request changes nothing outside `docs/` and `eval/`.
  - R62-003: the header names PRD revision 8 and blueprint revision 9.
  - R62-004: Open point 6 added (whether the gate's machine runs as root); section 8 points to it.
  - No row, state, count or `.expect` list changed.
- **Revision 6.** Increment delta 1 (section 12): story 2's 50 rows written as code in
  `eval/tests/story-2.test.mjs`; the story-2 packet files shipped; the 29-row `.expect` list of
  section 6 confirmed against main. The header names PRD revision 9 and blueprint revision 10. No
  row, state, count or `.expect` list changed.
- **Revision 7.** Increment delta 2 (section 12): defect D-2, from the founder's decision of
  2026-10-28. One row added, T-REQ-08-N4, for the new criterion REQ-08 c5, as code in
  `eval/tests/story-3.test.mjs`, staged on a large shelf so that its race shows on GitHub's runner
  as well as on a laptop (section 12, delta 2); story 3 added to sections 2, 6 and 7 (99 rows); the coverage map
  of section 5 gains REQ-08 c5; section 8's blueprint-decisions gap amended. The header names PRD
  revision 10 and blueprint revision 11. No existing row, state or `.expect` list changed.

## 12. Increment deltas

Deltas made after the first build landed (INCREMENT.md section 3, item 3). Each lists the new,
changed and retired rows, and, for every new or changed row, its expected state against the current
main, which the story's `.expect` records.

### Delta 1: story 2, done and drop (2026-10-28)

The founder's decision, in their words: "story 2 of the plan: done and drop, as docs/eval-plan.md
and docs/PRD.md already specify" (PRD section 10, amendment 1; blueprint section 14, delta 1). No
product question was asked.

- **New rows:** none. **Changed rows:** none. **Retired rows:** none, so there is no
  `eval/stories/2.retire`. Every row keeps the id, Given/When/Then, kind, owner and state this plan
  gave it at gate 5; the counts of section 7 are unchanged (98 rows).
- **Rows as code.** The 50 story-2 rows of section 6, until now rows in this plan only (INCREMENT.md
  section 3, item 4), are written as code in `eval/tests/story-2.test.mjs` from their Given/When/Then
  in section 4: one `node --test` test per row, its title starting with the row id, each starting
  `node app/shelf.mjs` as a child process in a fresh temporary directory and observing only stdout,
  stderr, the exit code and the bytes or presence of files there, as section 2 says. The file holds
  its own copies of the assertion helpers that `story-1.test.mjs` holds, in the same shape, so that
  neither test file depends on the other; `eval/tests/harness.mjs` is unchanged. `eval/tap-to-rows.mjs`
  already held the 50 ids under `story-2.test.mjs`, keyed on that file's presence, so its expected-id
  list is unchanged and is now active: a story-2 row that does not run is written
  `fail <id> did not run`.
- **Expected state against the current main**, story 1 merged (main at `869f034`), where `done`
  and `drop` are unknown commands: the state-before-the-build column of section 4 holds row for
  row. Run on 2026-10-28 with `sh eval/run.sh` against that `app/`: the 29 rows of the
  `eval/stories/2.expect` list in section 6 fail, each with the reason the column states (the first
  `done` or `drop` the row runs exits 2 where 0 or 1 is expected), the other 21 story-2 rows pass,
  and the 48 story-1 rows pass. The packet ships that list unchanged as `eval/stories/2.expect`.
- **Packet files shipped:** `eval/stories/2.txt` (`app/shelf.mjs`, `app/src/shelf.mjs`, as section 6
  and D10), `eval/stories/2.md` (the brief) and `eval/stories/2.expect` (29 lines).
- **Restraint.** No surface gains or loses a control that the plan does not already assert: `done`
  and `drop` are two of the four commands the PRD names, the usage text has named them since story
  1, and T-REQ-05-N3 already asserts that the four are the only commands. The four restraint rows
  of section 1 stand; none is added.
- **Gaps and untestable** (sections 8 and 9): unchanged. The permission rows of story 2
  (T-REQ-03-N7, T-REQ-07-P3, P4, N3, N4, T-REQ-08-P2, P3, N2, N3) are among the 15 of section 8 and
  carry the same `cannot stage: running as root` handling.

### Delta 2: defect D-2, two commands at once (2026-10-28)

The founder's decision, in their words (2026-10-28, login ajpasco): "D-2: fix now, option (b), a
per-process temporary file name." The record is `docs/defects/D-2.md`; the criterion it becomes is
REQ-08 c5 (PRD section 10, amendment 2); the blueprint's delta is section 14, delta 2 (TD-20).

- **New rows:** one, T-REQ-08-N4 (section 4, REQ-08), tracing to REQ-08 c5 and back (section 5).
  Negative, because its first assertion is that a refused command did not change the shelf; its
  second, that at least one exit-0 command's change is on the shelf, is there so that a fix which
  swallowed the write error and exited 0 without writing would not pass it. **Changed rows:** none.
  **Retired rows:** none, so there is no `eval/stories/3.retire`. The counts of section 7 become
  99 rows.
- **Rows as code.** T-REQ-08-N4 is written in `eval/tests/story-3.test.mjs` from its Given/When/Then:
  two `node app/shelf.mjs done` processes started in the same tick in a fresh temporary directory
  holding the large shelf of section 4's row (the two books the commands act on, then 400 to-read
  books with 40,000-character titles, about 16 MB), forty trials with the shelf restaged before
  each, observing only each process's exit code, stdout and stderr and the lines `list` prints
  afterwards, as section 2 says; no row imports `app/`. The row starts its processes with its own
  asynchronous spawn, so that two can start in the same tick and so that `list` of a 16 MB shelf is
  read whole (the harness's synchronous runner has Node's default 1 MB output limit); it still
  observes nothing but stdout, stderr and the exit code. `eval/tap-to-rows.mjs` gains the entry
  `'story-3.test.mjs': ['T-REQ-08-N4']`, keyed on that file's presence as the other two are, so
  the row is written `fail T-REQ-08-N4 did not run` if it does not run. `eval/tests/harness.mjs`
  is unchanged.
- **Expected state against the current main**, story 2 merged (main at `a9c2f92`), where both
  processes write and rename the one shared temporary file `.shelf.json.tmp`: fails. In most of the
  forty trials the two writes overlap: the second process's write truncates and refills the file
  the first has written, the first rename installs the second process's document and the second
  rename finds no temporary file, so one `done` exits 1 with the cannot-write message while its
  book is `read` on disk (the QA pass saw 3 to 6 such trials in 10 with a two-book shelf on a
  laptop). The row's reason names the trial, the command, its exit code and stderr, and the `list`
  line found where `<id> to read <title>` was expected. Should the two writes instead leave the
  file torn, `list` afterwards is refused and the row fails on that, since no exit-0 line describes
  a shelf that cannot be read. With the fix of TD-20, no trial has a refused `done`, both exit 0 in
  every trial, `list` prints a whole shelf and the last writer's book is `read`, so the row passes.
  The packet ships `eval/stories/3.expect` with the one line `fail T-REQ-08-N4`.
- **Why a large shelf, and forty trials.** The failure is a race between the two processes' writes
  of the one temporary file; its window is the time one process takes to write that file, which
  for a two-book shelf is microseconds. The first draft of this row staged two books alone: it
  failed on a laptop in its second trial, and passed on GitHub's runner (pull request #5, preview
  run 40812255053), where the two processes' writes never overlapped in forty trials, so the row
  asserted nothing against main there. With a 16 MB file the write takes milliseconds, longer than
  the usual difference between the two processes' starts, so the writes overlap in most trials
  wherever the row runs; forty trials then make a clean run against the unfixed store practically
  impossible, and keep the row's running time to tens of seconds at most (120 processes, each
  reading and writing 16 MB). The size (400 filler books of 40,000 characters) and the trial count
  are a default proposed by the packet drafter, not measured on the runner (the QA draft had twenty
  trials and two books).
- **Packet files shipped:** `eval/stories/3.txt` (`app/src/store.mjs`), `eval/stories/3.md` (the
  brief) and `eval/stories/3.expect` (one line).
- **Restraint.** No surface gains or loses a control: the four commands, their arguments, their
  output and the one file are as they were; the temporary file is still removed on failure and
  renamed away on success, which T-REQ-01-N6 and T-REQ-08-N1 to N3 already assert for the
  directory listing. No restraint row is added.
- **Gaps and untestable** (sections 8 and 9): section 8's blueprint-decisions gap now says that the
  lost update of TD-17 is still asserted by no row, and that REQ-08 c5 has its row. No new gap; the
  row needs no `chmod`, so it is not among the 15 permission rows and runs as root too.
