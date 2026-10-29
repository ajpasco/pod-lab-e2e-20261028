# Gate 7 review: the acceptance tests of shelf (story 1 packet, runner, conventions step)

Reviewer: a fresh session that did not write the tests. Standard: `docs/eval-plan.md` revision 5
(sections 1, 2, 3, 4, 6, 8), `docs/TECH-SPEC.md` revision 9 (sections 7, 10, 13), `docs/PRD.md`
revision 8, the eval-plan rubric, ORCHESTRATOR.md "Gate 7", RUNTIMES.md "What the gate needs from any
runner", PRACTICES.md section C and `.github/scripts/gate.sh`.

**I could not run anything.** Every verdict below comes from reading the files. Three things only a
run settles are listed at the end under "Not settled by reading". There is no `app/` and I imagined
none.

## Verdict

No blockers. Three advisories. The 48 tests match the 48 rows, the packet files match the plan, and
the runner, converter and conventions files match plan sections 2 and 3 and blueprint section 13,
with the small departures in G7T-01 to G7T-03.

## 1. Row ids against tests

None found.

- `story-1.test.mjs` has 48 top-level `test('T-REQ-..-.. ...')` calls. A count of `^test\('T-REQ-\d\d-[PN]\d+ ` gives 48.
  The only other `test(` hit is the header comment.
- The ids are the plan's section 6 list: REQ-01 P1 P2 P3 P4 P5 P6 P8 P10 P11 and N1 to N8; REQ-02 P1 P2 P4
  P5 P6 N1 N2; REQ-05 P1 to P3 and N1 to N3; REQ-06 P1 N1 N4 N6; REQ-07 P1 P2 N1 N2; REQ-08 P1 N1;
  REQ-09 P1 P2 P5 P6 N1 N2 N5 N6. Each appears once. Each title starts with the id and a space.
- No story-2 id is coded. `story-2.test.mjs` does not exist. The 50 story-2 ids appear only in the
  converter's `STORY_IDS`, which plan section 2 and Open point 4 require.
- No `describe`, `it` or nested `test` exists.

## 2. Given, When, Then against each test

None found. I read all 48 against their rows.

- Every Given is staged as the row says. The staged shape is the blueprint section 7 shape, as plan
  section 2 requires. Where a row says "(both exit 0)" or "(asserted)", the code asserts it through
  `given()` or `assertSucceeds`.
- Every Then is asserted and nothing more. "Refused (n)" is implemented as exit n, stderr non-empty and
  stdout empty, which is the plan's shorthand. "Untouched" is a byte comparison, or `null` for no file.
- The four usage words are asserted only in the rows D11 names: T-REQ-05-P1, P2, P3, N2, N3 and
  T-REQ-06-N6. No other stderr wording is asserted.
- No field name, module, library or message wording is asserted. T-REQ-01-N7 walks the values and never
  reads a key. The staged field names are the section 7 shape, which the plan tells the rows to stage.
- The permission rows prove their staging with the row's own process, as plan section 2 says. They fail
  with `cannot stage: running as root`, and restore permissions before comparing bytes. The REQ-08
  proof writes to the file and creates a file in the directory, as the plan says.
- The failure reasons the plan predicts hold in the order the code asserts them. The status is asserted
  first, then stderr, then stdout. Examples: `exit 1 where 2 is expected`, `exit 1 where 0 is expected`,
  and the empty-stdout message for T-REQ-02-P1, P2 and P5. The 17 rows the plan says pass against the
  empty tree assert only what a failed start satisfies.

## 3. Packet files

None found.

- `eval/stories/1.expect` has 31 lines. They equal the plan's section 6 list in content and order.
- `eval/stories/1.txt` lists `app/shelf.mjs`, `app/src/shelf.mjs` and `app/src/store.mjs`, and nothing else.
- `eval/stories/1.md` names `docs/PRD.md`, `docs/TECH-SPEC.md` (sections 2, 5, 7, 10, 13),
  `docs/eval-plan.md` section 4 and `eval/conventions/commits.md`. All exist in the working tree. The
  three `docs/` files are untracked today and arrive with the freeze pull request. The brief states 31
  and 17, matching the plan. It names no later-story file.

## 4. Runner and converter against the plan's Commands section

None found, except the advisories G7T-01 and G7T-02.

- Guard: the report directory is deleted and recreated, then `find app -name '*.mjs' -type f` is checked
  before `npm ci`. An absent or empty `app/` prints one line and skips the install, ESLint, Prettier and
  both checks.
- Order: `npm ci`, ESLint, Prettier, `forbidden-in-app.sh`, `layout-check.sh`. `set -e` stops the run
  before `rows.txt` exists, as plan section 3 says.
- Deferral flow:
  - The list is copied once into `eval/report/deferred-read.txt` before any row runs.
  - A line defers only when it holds a whole-word `D-<k>` after the id.
  - The verdict run uses one `--test-skip-pattern` per id, escaped, `^id( |$)`. This cannot leave out
    P10 when P1 is deferred.
  - The report run uses `--test-name-pattern` for the listed ids only, with its status ignored.
  - The converter reads the copy first. A tampered copy can only turn a deferral into a `fail`.
- Line forms in `tap-to-rows.mjs`:
  - `pass <id>`, `fail <id> <reason>` (first error line, whitespace collapsed, 200 characters at most,
    never empty), `fail <id> skipped`, `fail <id> did not run`.
  - `fail <id> did not finish` for a deferred row the report run did not finish. This is the plan's
    wording for deferred rows; the task prompt's line list names only `did not run`.
  - `deferred <id> D-<k> <reason>` and `fail node-test exited <n> with every row reported`.
  - A row left out by the pattern is never written `skipped`, because deferred ids take the report-run path.
- Exit status: 1 when any `rows.txt` line starts with `fail ` or the verdict status is non-zero. Otherwise 0.
- `eval/.gitignore` holds exactly `report/` and `conventions/node_modules/`. `eval/runtime` holds `node 22`.
- The converter's story-1 list equals the 48 ids and its story-2 list the 50. Ids are included only
  when the story's test file exists, which is Open point 4.

## 5. Conventions files against blueprint section 13

None found, except G7T-01 and G7T-02.

- `package.json` pins `eslint` 9.39.1, `@eslint/js` 9.39.1 and `prettier` 3.6.2. `package-lock.json`
  resolves the same three versions (lines 122, 427 and 968), and all 87 `resolved` URLs are on
  `registry.npmjs.org`.
- `eslint.config.mjs` holds:
  - `max-lines` 300, `max-lines-per-function` 50, `complexity` 10, `camelcase`, and `no-warning-comments`
    with `todo` and `fixme`.
  - `no-empty`, `no-unsafe-finally` and the `@eslint/js` recommended rules.
  - `noInlineConfig: true`.
  - The general import rule: only `node:` and relative imports.
  - Per file: the boundary imports only `./src/shelf.mjs`; the rules import only `./store.mjs` and use
    no `process` or `console`; the store imports only `node:` modules and uses no `process` or `console`.
- `prettierrc.json` is `{ "singleQuote": true, "printWidth": 100 }`. `prettierignore` is `node_modules`.
- `forbidden-in-app.txt` holds the seven patterns of the blueprint: `eval/`, `rows\.txt`, `node:test`,
  `--test-reporter`, `deferred\.txt`, `\.expect`, `T-REQ-`. `forbidden-in-app.sh` runs
  `grep -rEnf eval/conventions/forbidden-in-app.txt app` and maps grep's 0, 1 and 2 correctly.
- `layout-check.sh` bans `package.json`, `package-lock.json` and `node_modules` at the root and under
  `app/`. It allows exactly the three D2 files.
- `commits.md` holds the blueprint's commit rule.

## 6. Machine paths, network, `app/` imports, later-story files

None found.

- A search of `eval/` outside `conventions/node_modules/` for `/Users/`, `/home/`, `/private/`,
  `localhost`, `file:` and `C:\` found nothing.
- Tests make no network request. Only `npm ci` reads the registry, which plan section 2 states.
- No file imports `app/`. The tests spawn `process.execPath app/shelf.mjs` with `cwd` set to a fresh
  `os.tmpdir()` directory. The relative `app/shelf.mjs` is resolved from the root, where `run.sh` has
  done `cd "$root"`.
- Story 1's tests depend on nothing a later story creates. `eval/deferred.txt` is optional.

## 7. POSIX portability

None found. `run.sh`, `forbidden-in-app.sh` and `layout-check.sh` use `#!/bin/sh`, `set -eu`, `[ ]`,
`case` with the leading-parenthesis form (safe inside `$( )` in bash 3.2), `command -v`-free logic,
`printf`, `sed`, `awk` and `find`. They use no arrays, no `[[ ]]`, no `local`, no process substitution
and no `<<<`. The sed bracket expression `[][\.*^$()+?{}|-]` is valid POSIX.

## Advisories

### G7T-01 (advisory, plan-correction)

**Description.** `run.sh` runs the install and ESLint with flags the plan and blueprint do not state.
The flags are in addition to the stated commands; none replaces one.

**Basis.**
- `run.sh` line 21: `npm ci --prefix eval/conventions --no-audit --no-fund --loglevel=error`. Plan section 2 step 2
  and blueprint section 13 item 1 say `npm ci --prefix eval/conventions`.
- `run.sh` line 22: `eslint --config eval/conventions/eslint.config.mjs --no-config-lookup app`. Plan step 3
  and blueprint item 2 say `eslint --config eval/conventions/eslint.config.mjs app`.

**Why it matters.** Plan section 3 and Open point 1 let the exact invocation be "confirmed or replaced at
gate 7". If the flags stay, the text in `docs/` should say so. If they go, the script should match the
text. The flags look harmless, since `--no-config-lookup` serves PRACTICES C rule 2. I could not prove
that either way.

### G7T-02 (advisory, plan-correction)

**Description.** The layout check and the forbidden-in-app check do not see a symbolic link under `app/`.
The layout check asserts "no file other than the three" through `find app -type f`, which lists regular
files only. `grep -r` does not follow symbolic links met during recursion. The guard's `find ... -type f`
likewise ignores a link named `*.mjs`.

**Basis.** `layout-check.sh` line 24: `extra=$(find app -type f | while ...`. `forbidden-in-app.sh` line 5:
`grep -rEnf ... app`. The `-name` ban on `package.json` and `node_modules` does see links, so the gap
concerns other names only. The gate copies `app/` with `cp -R`, which can carry links.

**Why it matters.** A link in `app/` can sit beside the three D2 files without the check naming it. The
stated rule is about files; whether a link is one is a reading of D2 that the user has not made.

### G7T-03 (advisory, plan-correction)

**Description.** The rows assert a trailing newline that the PRD and plan wording do not mention.

**Basis.** `text()` in `story-1.test.mjs` is `lines.join('\n') + '\n'`, and every stdout row compares
with `assert.equal(r.stdout, expected)`. The plan's rows say "stdout is exactly `added 1 Dune`" and the
PRD says "prints exactly `added 1 Dune`". Only blueprint section 10 says "each followed by a newline".

**Why it matters.** It follows from the blueprint, from PRD "one line" and from the plan's "exactly two
lines". It could still fail a build that follows the PRD sentence literally. A one-sentence statement in
the plan would close it. I did not weigh whether this is a defect of the tests or of the plan's wording.

## Not settled by reading

These need the run that gate 7 requires against the empty tree, and I did not make it.

- **The shape of Node 22's TAP output.** The converter's regexes assume top-level `ok N - title` lines,
  `error:` with a quoted or `|-` block, and `# SKIP` markers. The 31 predicted reasons depend on this.
- **ESLint's behaviour with the config.** Whether the `regex` patterns of `no-restricted-imports` and the
  `**/app/...` file globs resolve as intended under `--config` is not confirmed. I did not read the
  planted-builder-file check of plan section 3. The per-file rules in `eslint.config.mjs` are indented
  in a way Prettier would change, but only `app/` is checked.
- **Behaviour of `sh` on the founder's bash 3.2 and on dash.** I read for bashisms and found none. I
  did not execute the scripts.
