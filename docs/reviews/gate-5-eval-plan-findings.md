# Gate 5 findings: eval plan and stories, shelf

Artifact: `docs/eval-plan.md` revision 1. Checked against `docs/orchestrator/rubrics/eval-plan.md`, PRD revision 5, blueprint revision 4, RUNTIMES.md ("What the gate needs from any runner") and the Q1 to Q18 and D1 to D9 tables of `docs/PREPARATION-STATE.md`.

Verdict: 2 blockers, 2 advisories. The coverage is sound in both directions. The blockers are one test row that asserts a stored-file shape, and story scope that overlaps.

## Findings

### G5-B-01: T-REQ-01-N7 asserts the stored file's shape (blocker, plan-correction)

- **Description:** The row's Then pins the document's structure: how many top-level entries it has, their kinds, and how many entries each book has. The rubric bars asserting "a table or column shape". The PRD leaves the file's shape to the blueprint ("the field names and the file's exact shape are the blueprint's decision"), and blueprint section 4 says rows "observe titles and ids through `shelf list`, never by reading the file's fields". The business outcome the row protects is "nothing is stored that the PRD does not describe", for example no date or rating (PRD section 7). That needs a Then about stored values, not entry counts.
- **Basis, quoted from the row:** "`shelf.json` parses as JSON, its top level holds exactly two entries (one array of the two books, one integer), and each book holds exactly three entries: an id, a status and a title, with the values `1`/`2`, `to read` and the titles."
- **Resolution class:** plan-correction.

### G5-B-02: Stories 1 and 2 own the same two files (blocker, blueprint-change)

- **Description:** The rubric says "Scope is disjoint: two stories never own the same file", and the checker's verdict lists "overlapping story scope" as a blocker. The plan admits the overlap and leaves it as an open point instead of resolving it. The overlap comes from blueprint section 9 ("Edits `app/shelf.mjs` and `app/src/shelf.mjs` only"). The plan cannot fix it alone. A blueprint change, or the user deciding the rule is met by create-then-edit, is needed. I do not weaken the rubric rule.
- **Basis, quoted:** Plan section 6: "The scope is not disjoint in the strict sense of the rubric: stories 1 and 2 both name `app/shelf.mjs` and `app/src/shelf.mjs`". Story table, story 1: "Creates `app/shelf.mjs`, `app/src/shelf.mjs`, `app/src/store.mjs`". Story 2: "Edits to `app/shelf.mjs` and `app/src/shelf.mjs` only". Open point 2: "A gate decision is needed if the rubric rule is to hold literally."
- **Resolution class:** blueprint-change. If the user would rather accept the overlap, it becomes a user-decision.

### G5-A-01: Deferral is only half described in the Commands (advisory, plan-correction)

- **Description:** RUNTIMES.md requires a second run of the listed rows only. That run supplies `deferred <id> D-<k> <reason>` lines. A listed row that passes becomes `pass <id>`. A listed row that is skipped or unreported becomes a `fail`. The plan's numbered steps 1 to 9 hold one `node --test` run and no second run. They do not mention `deferred` lines. The converter rule "A skipped test is written `fail <id> skipped`" and the rule "an id in that set that did not appear in the report is written `fail <id> did not run`" would, as written, fail every row that `--test-skip-pattern` left out of the verdict run. The plan does not say the converter exempts rows listed in `eval/deferred.txt`.
- **Basis, quoted:** "A deferred row is handled as RUNTIMES.md describes: left out of the verdict run by `--test-skip-pattern`, and reported from a second run of the listed rows only." There is no corresponding numbered step.
- **Resolution class:** plan-correction.

### G5-A-02: T-REQ-01-P8 gives a failure reason its Then does not assert (advisory, plan-correction)

- **Description:** The state value `fails` is right, because `add Ulysses` fails. The stated reason is "`list` exits 1 where 0 is expected". The row's Then never asserts the exit code of `list`. It asserts only that `list` prints nothing, which holds on the empty tree. The reason a reader would see in `rows.txt` therefore differs from the one stated. The reason should name the `add Ulysses` assertion.
- **Basis, quoted:** the Then, "then it prints nothing, and when the reader runs `add Ulysses`, then stdout is exactly `added 3 Ulysses` ... and the exit code is 0". State: "fails: `list` exits 1 where 0 is expected".
- **Resolution class:** plan-correction.

## Checker's verdict (rubric section)

- **Requirements missing a P or an N test:** none found. Every REQ-01 to REQ-09 has at least one P and one N (P/N per requirement: 11/8, 6/2, 5/9, 5/9, 3/3, 1/6, 4/4, 3/3, 8/8).
- **Tests with no or an unknown requirement:** none found. Each of the 98 ids carries a PRD requirement number, and the criterion cited in each row's Given/When/Then belongs to that requirement. The four restraint rows trace to REQ-01 or REQ-05 and also cite PRD sections 3, 4 and 7. The plan creates no requirement id.
- **Criteria absent from both the tests and the gaps:** none found. I walked the mapping table against PRD criteria REQ-01 c1-14, REQ-02 c1-7, REQ-03 c1-14, REQ-04 c1-14, REQ-05 c1-5, REQ-06 c1-7, REQ-07 c1-5, REQ-08 c1-4 and REQ-09 c1-10. That is 80, and all are mapped and appear in a row's Then. The part of REQ-05 c1, c2, c3 and c5 that says usage "lists the four commands" is not asserted. It is recorded in Gaps with the reason (Q14) and in Untestable.
- **Register rows with no test:** none found. All 80 keys `REQ-nn cN` of blueprint section 4 map to row ids in plan section 5. Each row's content matches its register mechanism. This includes the two-run c1, the non-ascending stored order for REQ-02 c2, the four wrong-shape files, and the `chmod` rows.
- **Criteria whose only evidence is in-process rows:** none found. No row imports `app/`. Every row spawns `node app/shelf.mjs` and observes stdout, stderr, the exit code and files.
- **Tests with no owner story:** none found. Story 1 has 48 rows and story 2 has 50. The two lists sum to 98 with no duplicate and no omission.
- **Tests with no state-before-the-build value:** none found. Every row has `fails` or `passes`, and no row is `cannot run`.
- **Overlapping story scope:** found, see G5-B-02.
- **Tests depending on a later story's files:** none found. No story-1 row uses `done` or `drop`. Story 1 owns the staged forms (T-REQ-01-P6, P8; T-REQ-02-P2). Story 2 owns the real-command forms and depends only on story 1.
- **Gaps section exists:** yes (section 8).
- **Untestable section exists:** yes (section 9).

## "What a test may assert", row by row

Rows whose Then asserts a technical choice:

- T-REQ-01-N7, quoted in G5-B-01.

Rows checked and not flagged:

- Exit codes (0, 1, 2), "stderr non-empty" and "stdout empty" are claimed by PRD criteria. They are not a technical choice here.
- `shelf.json` is named by the PRD.
- T-REQ-01-N6 ("exactly one entry, `shelf.json`: no temporary file") is a business outcome: only a successful add creates `shelf.json`, and a failed command changes nothing. It does not name the blueprint's temporary-file name.
- T-REQ-08-N1 compares bytes and the directory listing. "No temporary file left" is a consequence of that comparison, not the thing under test.
- The restraint rows N8 and T-REQ-05-N3 judge structure, not wording.

No network-request restraint row exists. The plan records this as a gap with a reason (not observable from stdout, stderr, the exit code and files), so I do not count it as a defect.

## Counts

I recounted the plan's Counts section against the rows and it is correct.

| Requirement | Total |
|---|---|
| REQ-01 | 19 |
| REQ-02 | 8 |
| REQ-03 | 14 |
| REQ-04 | 14 |
| REQ-05 | 6 |
| REQ-06 | 7 |
| REQ-07 | 8 |
| REQ-08 | 6 |
| REQ-09 | 16 |

- **Overall:** 98 rows, 46 P and 52 N, 94 integration and 4 restraint.
- **Expected failures:** 31 for story 1 and 29 for story 2, 60 in all, and 38 `passes`.
- **Rows by criterion:** 80 + 11 + 3 + 4 = 98.
- **Empty-tree note:** the note at plan lines 308-311, 26 failing and 24 passing, also recounts correctly.

## State before the build

I judged each row against the stated empty-`app/` state (child exits 1, "Cannot find module" on stderr, stdout empty) for story 1, and against story-1 main (`done` and `drop` exit 2 with usage, stdout empty, file untouched) for story 2.

- **Rows whose stated value I believe wrong:** none found.
  - The `fails` rows all contain an assertion that the stated state violates: an exit 0, an exit 2, or a printed line.
  - The `passes` rows hold only exit-1-or-2-with-empty-stdout, untouched-file or no-file-created assertions. For example, story 1's REQ-07, REQ-08 and REQ-09 refusal rows hold under exit 1. Story 2's refusal-by-2 rows (REQ-03 N1, N2, N6, N7, N9 and the REQ-04 equivalents) hold under the unknown-command path.
  - The `fails` rows that expect exit 1 (T-REQ-03-N3, N4, N8 and the REQ-04, REQ-06 and permission equivalents) correctly fail in story 2's state, which exits 2.
- **Imprecise reason, not a wrong value:** T-REQ-01-P8, see G5-A-02.
- **Runner dependence:** the 15 permission rows' values assume a non-root runner. The plan states this, and the root-runner consequences are listed correctly (six more story-1 rows, five more story-2 rows). The choice of runner is carried as a founder decision from G4-A-01 and G4-2-A-06 and needs no new finding.

## The `.expect` files

- **`eval/stories/1.expect`:** 31 `fail` lines. They equal exactly story 1's 31 `fails` rows and omit its 17 `passes` rows. There is no `cannot run` row.
- **`eval/stories/2.expect`:** 29 `fail` lines. They equal exactly story 2's 29 `fails` rows and omit its 21 `passes` rows.
- **Defects:** none found.

## Cross-checks

- **Conventions step against blueprint section 13:**
  - The plan names the same tools, versions and files as the blueprint: npm via `npm ci --prefix eval/conventions`; ESLint 9.39.1 with `@eslint/js` 9.39.1; Prettier 3.6.2; `forbidden-in-app.sh` and `.txt`; `layout-check.sh`.
  - The commands match the blueprint flag for flag.
  - The step has no id, no Given/When/Then and no state before the build, which matches the rubric.
  - It declines types, dependency audit, secret scan and container lint, as the blueprint does.
  - Defects: none found.
- **Commands against RUNTIMES.md:**
  - Fits: `eval/run.sh` is run with `sh` from the root, and `eval/runtime` is `node 22`.
  - Fits: the report is deleted at the start, and the converter writes `pass <id>` and `fail <id> <reason>`.
  - Fits: skipped rows become failures.
  - Fits: a step that is not a row fails before `rows.txt` is written.
  - Fits: `did not run` and `fail <step>` lines exist, `eval/.gitignore` holds `report/`, and the `.expect` files are specified.
  - Gap: the deferral flow, see G5-A-01.
- **Decisions:** Q10, Q14, Q15, Q18 and D1 to D9 are cited consistently with the record.
