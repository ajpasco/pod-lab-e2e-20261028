# Eval plan and stories: shelf

Revision 9.

Written against PRD revision 12 and blueprint revision 13 (revisions after PRD 5 and blueprint 4 changed no requirement, criterion or register row until PRD 10, which added REQ-08 c5, and blueprint 11, which added its register row; PRD 11 added REQ-02 c8 and blueprint 12 its register row; PRD 12 and blueprint 13 added no criterion and no register row; PRD 9 and blueprint 10 record increment delta 1, story 2, PRD 10 and blueprint 11 record increment delta 2, defect D-2, PRD 11 and blueprint 12 record increment delta 3, defect D-3 with D-4 and D-1 carried, and PRD 12 and blueprint 13 record increment delta 4, the deferrals of D-5 and D-6 with D-1's wording corrected, all four carried here as section 12). Every `REQ-nn` below is an id
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
`eval/tests/story-1.test.mjs`, `eval/tests/story-2.test.mjs`, `eval/tests/story-3.test.mjs` and
`eval/tests/story-4.test.mjs`, one file per story, so a story's rows stay out of main until its
packet opens; and in `eval/tests/defects.test.mjs`, which holds the rows that reproduce defects the
founder deferred (section 12, delta 3: T-REQ-01-N9 for D-4; delta 4: T-REQ-08-N5 for D-5 and
T-REQ-08-N6 for D-6), each listed in `eval/deferred.txt`
beside its defect id until the founder puts the defect in, when the packet that fixes it removes the
line and the row stays where it is. `eval/stories/` holds each
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
(section 8, Gaps). The story-3 row is stated against main with story 2 merged (`a9c2f92`), the
story-4 row and the deferred row T-REQ-01-N9 against main with story 3 merged (`d01f4a9`), and the
deferred rows T-REQ-08-N5 and T-REQ-08-N6 against main with story 4 merged (`6ba654d`).

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
| T-REQ-01-N9 | Deferred (D-4; `eval/deferred.txt`). Given a `shelf.json` holding no books whose next id is the largest id shelf can store (9007199254740991), when the reader runs `add Dune` and then `list`, then if the `add` was refused (non-zero exit) it printed nothing on stdout, put a message on stderr and left `shelf.json` untouched; and in either case `list` afterwards exits 0 with nothing on stderr: shelf reads its own file back without refusing it as corrupt, because a file shelf wrote on a successful command is still a shelf. The row never reads what next id the file stores, so it chooses no behaviour at the ceiling, which the founder has not decided, and rules out none of the options D-4's record lists. (REQ-01 c1 and c2; PRD section 4 Corrupt shelf file and Failed command; D-4; added by section 12, delta 3) | integration | none yet: deferred by the founder (D-4); the story that fixes D-4, when the founder puts it in | fails, against main with story 3 merged (`d01f4a9`): `add Dune` exits 0 and writes a next id of 2^53, then `list` is refused (`list after the add exits 1 where 0 is expected: shelf: shelf.json is not a shelf (nextId is not a positive integer); fix or remove it`); reported `deferred T-REQ-01-N9 D-4 <reason>`, in no `.expect` |

### REQ-02: List the books

| ID | Given / When / Then | Kind | Owner story | State before the build |
|---|---|---|---|---|
| T-REQ-02-P1 | Given a shelf of {1 to read Dune; 2 read Emma}, when the reader runs `list`, then stdout is exactly the two lines `1 to read Dune` and `2 read Emma`. (REQ-02 c1) | integration | 1 | fails: stdout is empty where two lines are expected |
| T-REQ-02-P2 | Given a `shelf.json` whose books are stored in the order 3, 1, 2 (3 Ulysses read; 1 Dune read; 2 Emma to read), when the reader runs `list`, then the lines appear in ascending id order: 1, 2, 3. (REQ-02 c2) | integration | 1 | fails: stdout is empty where three lines are expected |
| T-REQ-02-P3 | Given three books added with `add`, when the reader runs `done 3` and `done 1` (each exits 0, asserted) and then `list`, then the lines appear in ascending id order: `1 read ...`, `2 to read ...`, `3 read ...`. (REQ-02 c2, with the real `done`) | integration | 2 | fails: `done 3` exits 2 (unknown command) where 0 is expected |
| T-REQ-02-P4 | Given a shelf of {1 to read Dune}, when the reader runs `list`, then the exit code is 0. (REQ-02 c4) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-02-P5 | Given two directories, one with a shelf of {1 to read Dune} and one with a shelf of {1 to read Emma; 2 read Ulysses}, when the reader runs `list` in each, then each prints the books of its own `shelf.json` only. (REQ-02 c6) | integration | 1 | fails: both directories print nothing |
| T-REQ-02-P6 | Given a shelf of {1 to read Dune; 2 read Emma}, when the reader runs `list x` and `list`, then both exit 0 and both print exactly the same two lines. (REQ-02 c7) | integration | 1 | fails: exit 1 where 0 is expected |
| T-REQ-02-P7 | Given a shelf of 20,000 to-read books titled `Book number <id>` (about 1.4 MB of `list` output, far more than a pipe buffer holds), when the reader runs `list` and stops reading after the first chunk, closing their end of the pipe as `head -1` does, then the first line they took is `1 to read Book number 1`, the exit code is 0, stderr is empty and `shelf.json` is untouched. (REQ-02 c8; D-3; added by section 12, delta 3) | integration | 4 | fails, against main with story 3 merged (`d01f4a9`): `exit 1 (signal null) where 0 is expected`, with Node's unhandled EPIPE stack on stderr |
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
| T-REQ-08-N5 | Deferred (D-5; `eval/deferred.txt`). A command killed while it writes; no `chmod`, so it runs as root too. Given a large shelf, {1 to read Dune} followed by 1000 to-read books whose titles are 40,000 characters long (about 40 MB, so that the write takes long enough to be interrupted), when the reader starts `done 1` and ends it with SIGTERM the moment the command's temporary file appears beside `shelf.json` (the row watches for the name blueprint section 7 gives it, TD-20, which is the only way to hit the window from outside the process; a trial in which the command finished before the file was seen is inconclusive and is retried, up to five trials), then a later `done 1` exits 0 and prints `done 1 Dune` (the shelf the kill left behind is whole and still holds the book), and the directory afterwards holds exactly one entry, `shelf.json`: nothing of the interrupted command survives, as T-REQ-01-N6 and T-REQ-08-N1 to N3 assert after a successful or a refused write. The row chooses no behaviour: it passes whether a fix lets a signalled command finish whole (D-5's option c) or removes the stray on the next successful write (option b), and under option (a) it stays deferred. (REQ-08 c4, what a write that did not complete leaves on disk; REQ-03 c1, the later `done 1`; blueprint section 12 Shutdown; D-5; added by section 12, delta 4) | integration | none yet: deferred by the founder (D-5); the story that fixes D-5, when the founder puts it in | fails, against main with story 4 merged (`6ba654d`): the kill leaves `.shelf.json.<pid>.tmp` beside the whole `shelf.json`, the later `done 1` exits 0 and removes only its own temporary file (`trial 1: done 1 ended with exit null (signal SIGTERM), and after a later successful done 1 the directory holds [".shelf.json.<pid>.tmp","shelf.json"] where only shelf.json is expected`); reported `deferred T-REQ-08-N5 D-5 <reason>`, in no `.expect` |
| T-REQ-08-N6 | Deferred (D-6; `eval/deferred.txt`). Given two directories, one holding a shelf of {1 to read Dune} and the other holding `shelf.json` as a symbolic link to that file, when the reader runs `done 1` in the directory of the link, then either the command exited 0 and `list` in the linked file's directory exits 0 and prints exactly `1 read Dune` (the change the command reported is on the shelf the reader linked to), or the command was refused (non-zero exit: nothing on stdout, a message on stderr, the linked file untouched); and in either case `shelf.json` in the link's directory is still a symbolic link. The row chooses no behaviour: it passes whether a fix follows the link (D-6's option a) or refuses a linked `shelf.json` (option b), and under option (c) it stays deferred. (REQ-03 c1, read through the link; PRD section 2, the shelf is `shelf.json` in the current directory; PRD section 4 Failed command; D-6; added by section 12, delta 4) | integration | none yet: deferred by the founder (D-6); the story that fixes D-6, when the founder puts it in | fails, against main with story 4 merged (`6ba654d`): `done 1` exits 0 and prints `done 1 Dune`, the rename replaces the link with a regular file and the linked file is unchanged (`done 1 exited 0 printing "done 1 Dune", yet the linked file lists "1 to read Dune\n"`); reported `deferred T-REQ-08-N6 D-6 <reason>`, in no `.expect` |

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

All 82 criteria of the PRD and all 82 register rows of blueprint section 4 (same keys) map as follows
(REQ-08 c5 and its row were added by section 12, delta 2; REQ-02 c8 and its row by section 12,
delta 3).
The restraint rows T-REQ-01-N6, T-REQ-01-N7, T-REQ-01-N8 and T-REQ-05-N3 have no register row; they
trace to the requirement named and to the PRD's non-goals. The deferred rows have no register row of
their own and state no behaviour the founder has not decided. T-REQ-01-N9 (D-4) traces to REQ-01 c1
and c2 and to the PRD's Corrupt shelf file definition, whose rows T-REQ-01-P1 and P2 and the REQ-09
rows exist. T-REQ-08-N5 (D-5) traces to REQ-08 c4 (what a write that did not complete leaves on
disk; rows T-REQ-08-N1 to N3) and REQ-03 c1 (the later `done 1`; row T-REQ-03-P1), and to blueprint
section 12's Shutdown line, which has no criterion. T-REQ-08-N6 (D-6) traces to REQ-03 c1 (row
T-REQ-03-P1) read through the link, to PRD section 2 and to the PRD's Failed command definition.
Both are under REQ-08 because each stages a write that does not reach the shelf as the reader sees
it, the requirement whose refusal rows already assert what such a write leaves on disk.

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
| REQ-08 c5 | T-REQ-08-N4 | REQ-02 c8 | T-REQ-02-P7 |

## 6. Stories

| Story | Owns these files | Depends on | Tests it must turn green |
|---|---|---|---|
| 1 | Creates `app/shelf.mjs`, `app/src/shelf.mjs`, `app/src/store.mjs` | nothing (main has an empty `app/`) | The 48 story-1 rows below: every row for `add`, `list`, the unknown-command path, and the missing, unreadable, corrupt and unwritable file for `add` and `list` |
| 2 | Edits to `app/shelf.mjs` and `app/src/shelf.mjs` only; never `app/src/store.mjs` | Story 1: it edits the two files story 1 creates, and its rows use story 1's `add` and `list` | The 50 story-2 rows below: every `done` and `drop` row |
| 3 | Edits to `app/src/store.mjs` only; never `app/shelf.mjs` or `app/src/shelf.mjs` (section 12, delta 2) | Stories 1 and 2, both merged: it edits the file story 1 created, and its row uses story 2's `done` and story 1's `list` | The 1 story-3 row below: T-REQ-08-N4 |
| 4 | Edits to `app/shelf.mjs` only; never `app/src/shelf.mjs` or `app/src/store.mjs` (section 12, delta 3) | Stories 1 to 3, all merged: it edits the file story 1 created, and its row uses story 1's `list` | The 1 story-4 row below: T-REQ-02-P7 |

Every row has exactly one owner story, with three exceptions this plan records rather than hides: the
deferred rows T-REQ-01-N9 (D-4, section 12, delta 3), T-REQ-08-N5 (D-5) and T-REQ-08-N6 (D-6,
both section 12, delta 4) are owned by no story yet, because the founder deferred each defect and
chose no behaviour; each one's owner is the story that fixes its defect, when the founder puts it
in, and until then `eval/deferred.txt` keeps it out of the verdict. No story-1 row uses `done` or `drop`. The scope is not disjoint
in the strict sense of the rubric: stories 1 and 2 both name `app/shelf.mjs` and `app/src/shelf.mjs`,
story 1 to create them and story 2 to edit them afterwards. This is the blueprint's section 9 design
(the store is complete in story 1 so that story 2 never edits it) and the user's stated scope. The user
accepted create-then-edit as a recorded limitation (D10); story 2's scope file (`eval/stories/2.txt`)
names only `app/shelf.mjs` and `app/src/shelf.mjs`. Story 3 is an increment in sequence after both
merged, so the disjoint-scope rule, which is for stories built in parallel, does not apply to its
editing a file story 1 created (INCREMENT.md section 3, item 5). Story 4 is the same kind of
increment in sequence, after story 3 merged, editing `app/shelf.mjs`, which story 1 created and
story 2 edited.

**Packet files.** Story 1: `eval/stories/1.txt` (its scope file, listing `app/shelf.mjs`,
`app/src/shelf.mjs`, `app/src/store.mjs`), `eval/stories/1.md` (its brief, written at gate 7 from this
section) and `eval/stories/1.expect` (the list in this section). Story 2: `eval/stories/2.txt` (listing
`app/shelf.mjs` and `app/src/shelf.mjs`), `eval/stories/2.md` and `eval/stories/2.expect`, shipped with
story 2's packet after story 1 merges (section 12, delta 1). Story 3: `eval/stories/3.txt` (listing
`app/src/store.mjs`), `eval/stories/3.md` and `eval/stories/3.expect` (one line), shipped with the
D-2 packet after story 2 merges (section 12, delta 2). Story 4: `eval/stories/4.txt` (listing
`app/shelf.mjs`), `eval/stories/4.md` and `eval/stories/4.expect` (one line), shipped with the D-3
packet after story 3 merges (section 12, delta 3), which also ships `eval/deferred.txt` with the one
line `T-REQ-01-N9 D-4`. The deferral packet of D-5 and D-6 (section 12, delta 4) has no story and
ships no file under `eval/stories/`: it adds the lines `T-REQ-08-N5 D-5` and `T-REQ-08-N6 D-6` to
`eval/deferred.txt`.

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

**Story 4 rows (1).** T-REQ-02-P7.

### `eval/stories/4.expect` (1 row: story 4 against main with story 3 merged)

```
fail T-REQ-02-P7
```

Story 4 has no `passes` row and retires no row, so there is no `eval/stories/4.retire`.

**Deferred rows (3), owned by no story yet.** T-REQ-01-N9 (D-4), T-REQ-08-N5 (D-5) and T-REQ-08-N6
(D-6), in `eval/tests/defects.test.mjs`, listed in `eval/deferred.txt`. T-REQ-01-N9 fails against
main with story 3 merged, the other two against main with story 4 merged, and each is reported
`deferred <id> D-<k> <reason>`, outside the verdict; none is in any `.expect`, since a listed row
does not fail the run (INCREMENT.md section 9). Should one pass one day, the gate, the preview and the
rehearsal note that the list names a passing row: the defect may be fixed.

**On a runner that is root.** Both files assume a non-root runner. As root, the 15 permission rows fail
`cannot stage: running as root`. That adds, to story 1, the six rows T-REQ-07-P1, P2, N1, N2 and
T-REQ-08-P1, N1; and to story 2, the five rows T-REQ-03-N7, T-REQ-07-N3, N4 and T-REQ-08-N2, N3 (the
other four permission rows of story 2 already fail). The preview would then name them as unexpected
failures until the founder defers them (section 8).

## 7. Counts

Rows per requirement. "Fail S1" is the number of that requirement's story-1 rows expected to fail
against the empty `app/`; "Fail S2" the story-2 rows expected to fail against story-1 main; "Fail S3"
the story-3 rows expected to fail against story-2 main (section 12, delta 2); "Fail S4" the story-4
rows expected to fail against story-3 main (section 12, delta 3). The deferred rows T-REQ-01-N9
(D-4), T-REQ-08-N5 (D-5) and T-REQ-08-N6 (D-6) fail against story-3 and story-4 main too but are
reported `deferred`, so they are in no Fail column.

| Requirement | P | N | Integration | Restraint | Total | Fail S1 | Fail S2 | Fail S3 | Fail S4 |
|---|---|---|---|---|---|---|---|---|---|
| REQ-01 | 11 | 9 | 17 | 3 | 20 | 17 | 2 | 0 | 0 |
| REQ-02 | 7 | 2 | 9 | 0 | 9 | 6 | 1 | 0 | 1 |
| REQ-03 | 5 | 9 | 14 | 0 | 14 | 0 | 8 | 0 | 0 |
| REQ-04 | 5 | 9 | 14 | 0 | 14 | 0 | 8 | 0 | 0 |
| REQ-05 | 3 | 3 | 5 | 1 | 6 | 5 | 0 | 0 | 0 |
| REQ-06 | 1 | 6 | 7 | 0 | 7 | 3 | 2 | 0 | 0 |
| REQ-07 | 4 | 4 | 8 | 0 | 8 | 0 | 2 | 0 | 0 |
| REQ-08 | 3 | 6 | 9 | 0 | 9 | 0 | 2 | 1 | 0 |
| REQ-09 | 8 | 8 | 16 | 0 | 16 | 0 | 4 | 0 | 0 |
| **Total** | **47** | **56** | **99** | **4** | **103** | **31** | **29** | **1** | **1** |

Overall: 103 rows (47 positive, 56 negative); 99 `integration`, 4 `restraint`, no `unit`, `e2e`,
`production` or `review`. Per story: story 1 has 48 rows (31 fail, 17 pass); story 2 has 50 rows (29
fail, 21 pass); story 3 has 1 row (1 fail, 0 pass); story 4 has 1 row (1 fail, 0 pass); 3 rows,
T-REQ-01-N9, T-REQ-08-N5 and T-REQ-08-N6, are owned by no story yet and deferred (D-4, D-5, D-6);
62 rows fail before their story and 38 pass. The 103 rows are the 82 criteria (one row each), plus
11 rows from the four splits (REQ-07 c5 into 4 rows, REQ-08 c4 into 3, REQ-09 c9 and c10 into 4
each: 15 rows for 4 criteria), plus 3 rows for the real-command forms (T-REQ-01-P7, P9,
T-REQ-02-P3), plus 4 restraint rows, plus the 3 deferred rows of D-4, D-5 and D-6, which trace to
criteria that already have their rows: 82 + 11 + 3 + 4 + 3 = 103.

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
- **A write failure on stdout that is not a closed pipe (REQ-02 c8; blueprint TD-21).** T-REQ-02-P7
  stages the one case the founder decided, a reader that closes the pipe. A fix that silenced every
  failure to write stdout, not only the closed pipe, would pass it, and no row stages another such
  failure: the one way to do so from outside the process, a stdout opened on `/dev/full` (`ENOSPC`),
  exists on Linux only, and the rows run on the founder's machine as well as the gate's. That any
  other write failure is still reported as unclassified (TD-11) is held by the fresh reader against
  blueprint TD-21, not by a row. The refusal rows of every requirement still hold a handler that
  silenced stderr or forced exit 0 for anything but a stdout write failure.
- **The id ceiling (D-4, deferred).** The PRD is silent on what `add` does when the next id cannot
  be represented, and the founder deferred the defect without choosing a behaviour, so no criterion
  states one and T-REQ-01-N9 asserts only that the shelf stays readable; it is listed in
  `eval/deferred.txt` and reported outside the verdict until the founder puts D-4 in.
- **D-1 (deferred, no row).** The founder deferred it and, after TD-20 renamed the temporary file,
  had its record carried with `Row: none`. The record said the trigger was unreachable; by the
  founder's instruction of 2026-10-30 (section 12, delta 4) it now says the crash is reachable only
  by a directory named for the pid the process will get, and unlikely. No row stages it: the
  founder's decision stands at `Row: none`, and a row that pre-created directories for the pids to
  come would stage the application's process id, not a reader's act.
- **A command killed while it writes (D-5, deferred).** The PRD is silent on a signal: its
  Failed-command definition speaks of a non-zero exit code, which a killed process has none of. The
  founder deferred the defect without choosing a behaviour, so no criterion states one; the
  blueprint's Shutdown line records that the kill may leave the temporary file behind (section 12,
  delta 4), and T-REQ-08-N5 asserts only that a later `done 1` finds a whole shelf and that the
  directory then holds `shelf.json` alone. It is listed in `eval/deferred.txt` and reported outside
  the verdict until the founder puts D-5 in. The row ends the command with SIGTERM only; SIGINT,
  which the QA pass saw behave the same, and `kill -KILL`, which no fix of the record's options
  could help, have no row.
- **A symbolic link named `shelf.json` (D-6, deferred).** The PRD says the shelf is `shelf.json` in
  the current directory and nothing about a link; the founder deferred the defect ("links aren't in
  the PRD") without choosing a behaviour, so no criterion states one, and T-REQ-08-N6 asserts only
  that a change `done` reports as made is on the linked file, or that the command was refused with
  nothing changed, and that the link is still a link. It is listed in `eval/deferred.txt` and
  reported outside the verdict until the founder puts D-6 in. Only `done` through a link has a row;
  `add` and `drop` through a link, and `list` through a link (which works on `6ba654d`), have none.

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
- **Revision 8.** Increment delta 3 (section 12): defect D-3, from the founder's decisions of
  2026-10-28 and 2026-10-29, carrying D-4 and D-1. Two rows added: T-REQ-02-P7 for the new
  criterion REQ-02 c8, as code in `eval/tests/story-4.test.mjs`, and the deferred row T-REQ-01-N9
  for D-4, as code in `eval/tests/defects.test.mjs` and listed in the new `eval/deferred.txt`;
  story 4 added to sections 2, 6 and 7 (101 rows); the coverage map of section 5 gains REQ-02 c8;
  section 8 gains three gaps (a stdout write failure that is not a closed pipe, the id ceiling,
  D-1). The header names PRD revision 11 and blueprint revision 12. No existing row, state or
  `.expect` list changed.
- **Revision 9.** Increment delta 4 (section 12): defects D-5 and D-6 deferred by the founder's
  decision of 2026-10-30, and D-1's wording corrected at the founder's instruction of the same
  day. Two deferred rows added, T-REQ-08-N5 (D-5) and T-REQ-08-N6 (D-6), as code in
  `eval/tests/defects.test.mjs` and listed in `eval/deferred.txt` (103 rows); sections 2, 4, 5, 6
  and 7 name them; section 8 gains two gaps (a command killed while it writes; a symbolic link
  named `shelf.json`) and its D-1 entry carries the corrected wording. No story is added: the packet
  has no story files. The header names PRD revision 12 and blueprint revision 13. No existing row,
  state or `.expect` list changed.

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

### Delta 3: defect D-3, a reader that closes the pipe early; D-4 deferred; D-1 recorded (2026-10-29)

The founder's decision on D-3, in their words (2026-10-28, login ajpasco): "D-3, a closed pipe: with
a long list, 'shelf list | head -1' or 'shelf list | true' prints Node's unhandled 'error' event
(EPIPE) stack to stderr; fix now, the boundary in app/shelf.mjs, stderr empty and exit 0 when stdout
closes early." The record is `docs/defects/D-3.md`; the criterion it becomes is REQ-02 c8, with the
definition "Stdout closes early" (PRD section 10, amendment 3); the blueprint's delta is section 14,
delta 3 (TD-21). On 2026-10-29 the founder started the increment and had the same packet carry two
more records, in their words: "start D-3's increment, and carry in the same packet, by my decision:
D-4's record, its reproducing row and its eval/deferred.txt line (deferred, reason: reachable only by
a hand edit of shelf.json); D-1's record with my deferral (reason: it only happens when someone makes
a directory named .shelf.json.tmp by hand) and Row: none, noting it is unreachable after TD-20; and
the one-phrase fix to blueprint section 9's 'Two stories'."

- **New rows:** two. T-REQ-02-P7 (section 4, REQ-02), tracing to REQ-02 c8 and back (section 5),
  owned by story 4. Positive, because its headline assertion is what `list` does for a reader who
  stops early: the listing starts as criteria 1 and 2 say and the command ends with exit 0; its
  assertions that stderr is empty and the file untouched are what the criterion says does not
  happen. T-REQ-01-N9 (section 4, REQ-01), the reproduction of D-4, tracing to REQ-01 c1 and c2
  and the PRD's Corrupt shelf file definition, owned by no story yet and listed in
  `eval/deferred.txt` as `T-REQ-01-N9 D-4`. Negative, because it asserts that a shelf shelf wrote on
  a successful command is not refused: after the `add`, `list` exits 0 with nothing on stderr, and
  an `add` that was refused changed nothing. It never reads what next id the file stores, so it
  chooses no behaviour at the ceiling, which the founder has not decided: it passes whether a fix
  refuses that `add` with the file untouched (D-4's option a) or accepts it and refuses the next
  (option b), and under option (c) it stays deferred. **Changed rows:** none. **Retired rows:**
  none, so there is no `eval/stories/4.retire`. The counts of section 7 become 101 rows.
- **Rows as code.** T-REQ-02-P7 is written in `eval/tests/story-4.test.mjs` from its
  Given/When/Then: a shelf of 20,000 books staged in a fresh temporary directory, `node
  app/shelf.mjs list` started with its stdout piped to the row, which takes the first chunk, keeps
  its first line and destroys its end of the pipe, as `head -1` does; the row then observes the
  exit code, stderr and the file's bytes. It uses its own asynchronous spawn, as T-REQ-08-N4 does,
  because closing the reader's end while the child is still writing is not something the harness's
  synchronous runner can do; it still observes nothing but stdout, stderr, the exit code and the
  file, and imports nothing from `app/`. T-REQ-01-N9 is written in `eval/tests/defects.test.mjs`
  from its Given/When/Then with the harness's synchronous runner. `eval/tap-to-rows.mjs` gains the
  entries `'story-4.test.mjs': ['T-REQ-02-P7']` and `'defects.test.mjs': ['T-REQ-01-N9']`, keyed
  on each file's presence as the other three are, so either row is written `fail <id> did not run`
  (or, for the listed row, `fail <id> did not finish`) if it does not run. `eval/tests/harness.mjs`
  is unchanged.
- **Expected state against the current main**, story 3 merged (main at `d01f4a9`). T-REQ-02-P7
  fails: the boundary writes the whole listing with one `process.stdout.write` and has no handler
  for a write error on stdout, so when the row closes its end the write fails with `EPIPE`, Node
  raises an unhandled `error` event, prints its stack on stderr and exits 1; the row's reason is
  `exit 1 (signal null) where 0 is expected`. With a boundary that handles the closed pipe as TD-21
  says, the first line is still what the reader took, the exit code is 0, stderr is empty and the
  file is untouched, so the row passes. T-REQ-01-N9 fails too: `add Dune` on a next id of
  9007199254740991 exits 0 and writes a next id of 2^53, which the store's shape check (a safe
  integer) refuses on the next read, so `list` exits 1 with the corrupt message; but it is listed in
  `eval/deferred.txt`, so the runner leaves it out of the verdict run and writes it `deferred
  T-REQ-01-N9 D-4 list after the add exits 1 where 0 is expected: ...` from the report run. Run on
  2026-10-29 with `sh eval/run.sh` against that `app/`: `fail T-REQ-02-P7 exit 1 (signal null)
  where 0 is expected`, `deferred T-REQ-01-N9 D-4 ...`, and the 99 rows of stories 1 to 3 pass.
  The packet ships `eval/stories/4.expect` with the one line `fail T-REQ-02-P7`; the deferred row
  is in no `.expect`, because a listed row does not fail the run (INCREMENT.md section 9).
- **Why 20,000 books.** The failure needs the listing to be larger than the pipe buffer, so that
  the child is still writing when the reader closes; 20,000 short titles make about 1.4 MB, which
  is many times the usual 64 KB buffer, and `list` of it takes well under a second. The count is
  the QA draft's, kept as a default proposed by the packet drafter.
- **Packet files shipped:** `eval/stories/4.txt` (`app/shelf.mjs`), `eval/stories/4.md` (the
  brief) and `eval/stories/4.expect` (one line); `eval/deferred.txt` (one line, `T-REQ-01-N9 D-4`,
  under two comment lines); `docs/defects/D-3.md`, `D-4.md` and `D-1.md`.
- **Restraint.** No surface gains or loses a control: the four commands, their arguments, their
  success lines and their refusals are as they were, and stdout carries the same listing; what
  changes is only how the command ends when its reader has gone. T-REQ-05-N3 still asserts that
  the four commands are the only ones; the refusal rows of every requirement still assert that each
  refusal reaches stderr with its exit code, which a handler that silenced more than the closed pipe
  would break. No restraint row is added.
- **Gaps and untestable** (sections 8 and 9): section 8 gains three entries: a write failure on
  stdout that is not a closed pipe has no row (the fresh reader holds TD-21's line between `EPIPE`
  and the rest); the id ceiling has no criterion and its row is deferred; D-1 has no row by the
  founder's decision. Section 9 is unchanged. Neither new row needs `chmod`, so neither is among
  the 15 permission rows, and both run as root too.

### Delta 4: defects D-5 and D-6 deferred; D-1's wording corrected (2026-10-30)

The founder's decision, in their words (2026-10-30, login ajpasco), answering the decision list of
the QA pass of all on main `6ba654d`: "Defer both. D-5 deferred (record the stray file in the
blueprint's Shutdown line); F-1 numbered D-6 and deferred (links aren't in the PRD). One deferral
packet carries both, plus D-1's corrected wording." Their "F-1" with the reason "links aren't in the
PRD" is the symbolic-link report, now D-6; the stray-file finding is D-5. Their instruction for the
packet, the same day: "run /pod-works-increment for the D-5 and D-6 deferrals as one packet: both
records, their rows listed in eval/deferred.txt, and D-1's record reworded to "reachable only by a
directory named for the pid the process will get" (and "unlikely", not "unreachable"). No story
files." The records are `docs/defects/D-5.md` and `docs/defects/D-6.md`; the PRD records the
deferrals as amendment 4 and gains no criterion (PRD section 10); the blueprint's delta is section
14, delta 4, which changes the Shutdown line of its section 12. This is a packet with no story
(INCREMENT.md section 3): no `eval/stories/5.md`, `5.txt` or `5.expect` exists, nothing is built, and
every row but the three `eval/deferred.txt` defers passes against main's `app/`.

- **New rows:** two, both deferred and owned by no story yet. T-REQ-08-N5 (section 4, REQ-08), the
  reproduction of D-5, tracing to REQ-08 c4 and REQ-03 c1 (section 5) and listed in
  `eval/deferred.txt` as `T-REQ-08-N5 D-5`. Negative, because it asserts that nothing of an
  interrupted command survives in the directory and that the shelf it left behind is whole. It
  chooses no behaviour: a fix that lets a signalled command finish whole (D-5's option c) leaves
  the shelf changed and the directory clean, so the later `done 1` succeeds again (PRD Q3, REQ-03
  c3) and the row passes; a fix that removes stale temporary files on the next successful write
  (option b) leaves the shelf as staged and the later `done 1` cleans up, so the row passes; under
  option (a) it stays deferred. T-REQ-08-N6 (section 4, REQ-08), the reproduction of D-6, tracing
  to REQ-03 c1 read through the link, PRD section 2 and the Failed command definition (section 5)
  and listed as `T-REQ-08-N6 D-6`. Negative, because it asserts that a change reported as made is
  not missing from the shelf the reader linked to, and that the link the reader made is not
  replaced; it passes under a fix that follows the link (option a) or refuses a linked `shelf.json`
  (option b), and under option (c) it stays deferred. **Changed rows:** none. **Retired rows:**
  none; there is no story, so there is no `.retire` file either. The counts of section 7 become
  103 rows.
- **Rows as code.** Both are written in `eval/tests/defects.test.mjs` from their Given/When/Then,
  under the D-4 row. T-REQ-08-N5 stages the 40 MB shelf in a fresh temporary directory, starts
  `node app/shelf.mjs done 1` with its own asynchronous spawn (the harness's synchronous runner
  cannot signal a running child), polls for the command's temporary file, `.shelf.json.<pid>.tmp`
  (the name blueprint section 7 gives it, TD-20), and sends SIGTERM the moment it appears; a trial
  whose child closed before the file was seen is inconclusive and the row stages again, up to five
  trials, failing with `no trial of 5 saw the temporary file before the write ended` if none was
  conclusive. After one conclusive trial it runs `done 1` with the harness's runner and then reads
  the directory listing. It observes only exit codes, stdout, stderr and the directory listing; the
  temporary file's name is read for the timing of the signal, never asserted, and the row imports
  nothing from `app/`. T-REQ-08-N6 stages two directories under one fresh temporary directory,
  `synced/` with the shelf and `here/` with `shelf.json` a symbolic link to it (an absolute link),
  runs `done 1` in `here/` with the harness's runner, then `list` in `synced/` when the `done`
  exited 0, and reads whether `here/shelf.json` is still a link; it observes only exit codes,
  stdout, stderr, the linked file's bytes (when the `done` was refused) and the kind of the entry
  the reader made. `eval/tap-to-rows.mjs`'s entry for `defects.test.mjs` becomes `['T-REQ-01-N9',
  'T-REQ-08-N5', 'T-REQ-08-N6']`, so either new row is written `fail <id> did not finish` if it
  does not run. `eval/tests/harness.mjs` is unchanged.
- **Expected state against the current main**, story 4 merged (main at `6ba654d`). T-REQ-08-N5
  fails: the store writes `.shelf.json.<pid>.tmp` and renames it over `shelf.json`, removing the
  temporary file only when a step fails, so a SIGTERM between the write and the rename ends the
  process with the file left behind and the old `shelf.json` whole; the later `done 1` exits 0,
  prints `done 1 Dune` and removes only its own temporary file, so the listing is
  `[".shelf.json.<pid>.tmp","shelf.json"]`; the row's reason is `trial 1: done 1 ended with exit
  null (signal SIGTERM), and after a later successful done 1 the directory holds
  [".shelf.json.<pid>.tmp","shelf.json"] where only shelf.json is expected` (the QA orchestrator's
  six trials all saw the temporary file before the kill, so the first trial is expected to be
  conclusive). T-REQ-08-N6 fails: `done 1` in `here/` exits 0 printing `done 1 Dune`, the rename
  replaces the link with a regular file holding the change, and `synced/shelf.json` is unchanged,
  so `list` there prints `1 to read Dune`; the row's reason is `done 1 exited 0 printing "done 1
  Dune", yet the linked file lists "1 to read Dune\n"`. Both are listed in `eval/deferred.txt`, so
  the runner leaves them out of the verdict run and writes them `deferred T-REQ-08-N5 D-5 ...` and
  `deferred T-REQ-08-N6 D-6 ...` from the report run, beside `deferred T-REQ-01-N9 D-4 ...`; the
  100 rows of stories 1 to 4 pass, and the run exits 0. The expected reasons are taken from the QA
  orchestrator's reproductions of 2026-10-29 and 2026-10-30 on `6ba654d` (the QA run's
  `orch-all-log.txt` and `orch-d6-log.txt`, local to the founder's machine), not from a run of the
  rows by the drafter, whose session could not run `node`; the rehearsal is the run. There is no
  `.expect`: a packet with no story has none, and a listed row does not fail the run.
- **Why 40 MB and SIGTERM.** The failure needs the write of the temporary file to last long enough
  for the row to see the file and send the signal before the rename; 1000 filler books of 40,000
  characters make about 40 MB, which the QA pass found long enough in twelve trials of twelve, and
  one `done 1` of it takes about a second. SIGTERM is the signal the QA pass used for half its
  trials; SIGINT behaved the same and has no row. The size, the trial count of five and the signal
  are the QA draft's, kept as a default proposed by the packet drafter.
- **Packet files shipped:** `eval/deferred.txt` (two lines added); `docs/defects/D-5.md`,
  `D-6.md` and the reworded `D-1.md`. No file under `eval/stories/`.
- **Restraint.** No surface gains or loses a control: the four commands, their arguments, their
  success lines and their refusals are as they were, and nothing is built. T-REQ-08-N5 is itself a
  restraint-shaped assertion on the file surface (the directory holds `shelf.json` alone), as
  T-REQ-01-N6 and T-REQ-08-N1 to N3 are; its kind stays `integration` because it reproduces a
  defect rather than asserting the absence of an unrequested control. No restraint row is added.
- **Gaps and untestable** (sections 8 and 9): section 8 gains two entries, a command killed while
  it writes and a symbolic link named `shelf.json`, and its D-1 entry carries the corrected wording.
  Section 9 is unchanged. Neither new row needs `chmod`, so neither is among the 15 permission
  rows, and both run as root too.
- **D-1's wording.** `docs/defects/D-1.md` said, in its `Row:` line and its closing paragraph, that
  the trigger was unreachable after TD-20. By the founder's instruction quoted above it now says the
  crash is reachable only by a directory named for the pid the process will get, and unlikely, with
  the QA pass's check of 2026-10-29 on `6ba654d` as the evidence; its `Decision:` line is exactly as
  it was, it keeps `Row: none`, and it has no line in `eval/deferred.txt`. Section 8's D-1 entry
  and blueprint section 14, delta 3's note on D-1 carry the same correction, since both echoed the
  record's word.
