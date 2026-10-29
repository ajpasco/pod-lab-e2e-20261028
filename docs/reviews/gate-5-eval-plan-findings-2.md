# Gate 5 findings, second check: eval plan revision 2 and story list

Artifact: `docs/eval-plan.md` (revision 2). Rubric: `docs/orchestrator/rubrics/eval-plan.md`.
Read against PRD revision 7, blueprint (`docs/TECH-SPEC.md`) revision 6, `docs/orchestrator/RUNTIMES.md`
"What the gate needs from any runner", and `docs/PREPARATION-STATE.md` Q1 to Q19 and D1 to D11.
No earlier findings file was read.

Verdict: no blockers. Three advisories.

## Findings

| ID | Severity | Resolution class |
|---|---|---|
| G5-2-A-01 | advisory | plan-correction |
| G5-2-A-02 | advisory | plan-correction |
| G5-2-A-03 | advisory | blueprint-change |

### G5-2-A-01: T-REQ-01-N7 pins the stored representation of status and next id

- Description: the revision-1 blocker (asserting the file's shape) is fixed; the row no longer counts
  entries or names fields. Its Then still fixes how two values are stored: the status as the text
  `to read`, and the next id as `3`. The PRD states only that a book has a status "to read" or "read"
  and that "the file keeps the next id" (Q2). The stored form of both is the blueprint's decision (PRD
  Corrupt definition: "the field names and the file's exact shape are the blueprint's decision"; TD-6,
  section 7). A conforming build that stored the status differently (a boolean, say) or kept the last
  id instead of the next would fail a business-correct outcome. This is the only row I found whose Then
  reaches a technical choice. It is advisory because it asserts values, not a shape, and the rows already
  stage `shelf.json` in the blueprint's section 7 shape in their Givens.
- Basis, quoted from T-REQ-01-N7: "every value in it, at any depth, is one of the known values: the ids
  `1` and `2`, the next id `3`, the status `to read`, and the titles `Dune` and `Emma`."
- Resolution class: plan-correction.

### G5-2-A-02: the deferred-row "skipped or did not finish" line has no reason

- Description: RUNTIMES.md fixes the rows file lines as `pass <id>`, `fail <id> <one-line reason>` or
  `deferred <id> D-<k> <one-line reason>`. The plan writes a listed row that is skipped or did not
  finish as `fail <id>` with no reason, in section 2 step 7 and again in "How `rows.txt` is produced".
  The same paragraph does give reasons elsewhere (`fail <id> skipped`, `fail <id> did not run`). It
  fails the run either way; the defect is the line format only.
- Basis: plan step 7: "one that is skipped or did not finish is written `fail <id>`, which fails the
  run"; RUNTIMES.md: "`fail <id> <one-line reason>`".
- Resolution class: plan-correction.

### G5-2-A-03: the blueprint header names an older PRD revision (outside the artifact under review)

- Description: the blueprint says it is a blueprint of PRD revision 5 and mockup revision 4. The PRD
  is revision 7 (revisions 6 and 7 change one sentence and a legend, no criterion). The register the
  plan maps is unaffected; I found no row-level consequence. Reported so the header is not read as
  proof that the blueprint was swept against revision 7.
- Basis: `docs/TECH-SPEC.md` line 5, "Blueprint of PRD revision 5 and mockup revision 4"; `docs/PRD.md`
  line 3, "Revision 7."
- Resolution class: blueprint-change.

## Checker's verdict (rubric section)

- Requirements missing a P or an N test: none found. P/N per requirement: REQ-01 11/8, REQ-02 6/2,
  REQ-03 5/9, REQ-04 5/9, REQ-05 3/3, REQ-06 1/6, REQ-07 4/4, REQ-08 3/3, REQ-09 8/8.
- Tests with no or an unknown requirement: none found. All 98 ids are `T-REQ-01` to `T-REQ-09`; every
  `(REQ-nn cK)` citation names a criterion the PRD has (highest cited: REQ-01 c14, REQ-02 c7,
  REQ-03 c14, REQ-04 c14, REQ-05 c5, REQ-06 c7, REQ-07 c5, REQ-08 c4, REQ-09 c10). The four restraint
  rows each name one requirement (REQ-01 or REQ-05).
- Criteria absent from both the tests and the gaps: none found. PRD has 80 criteria (14+7+14+14+5+7+5
  +4+10); the section 5 table maps all 80, and each mapped row's cited criterion matches its text.
  Gaps lists no criterion as untested, and says so.
- Register rows with no test: none found. Blueprint section 4 has 80 rows with the same keys; each
  maps to a row. The REQ-05 c1, c2, c3, c5 and REQ-06 c7 rows carry the four-word usage check the
  register now states.
- Criteria whose only evidence is in-process rows: none found. No row imports `app/`; every row spawns
  `node app/shelf.mjs` and observes stdout, stderr, exit code and files (section 2).
- Tests with no owner story: none found. Section 6 lists 48 story-1 and 50 story-2 ids; I checked the
  two lists against the table and every id appears once.
- Tests with no state-before-the-build value: none found. Every row carries `fails:` or `passes:`;
  there are no `cannot run` rows.
- Overlapping story scope: stories 1 and 2 both name `app/shelf.mjs` and `app/src/shelf.mjs`. Recorded
  correctly, not an unresolved blocker. Section 6 says the scope is not disjoint in the strict sense,
  that story 1 creates and story 2 edits, cites the user's acceptance as D10 (Q19 item 1, Option A),
  and says story 2's scope file `eval/stories/2.txt` names only those two files and never
  `app/src/store.mjs`. That agrees with D10 and blueprint section 9. The file name `<n>.txt` is the
  one INCREMENT.md and BUILD.md use. Open point 2 is closed by D10.
- Tests depending on a later story's files: none found. No story-1 row runs `done` or `drop`; story-1
  rows that touch those words only stage state, use them as title text (T-REQ-01-N8), or check the
  usage text, which story 1 builds with all four commands (blueprint section 9). Story 2 rows use only
  story 1's `add` and `list`.
- Gaps and untestable sections exist: yes. Section 8 (Gaps) and section 9 (Untestable, "None", with
  the D11 reason). The network restraint is recorded in Gaps with its reason; the permission criteria
  are recorded as the Q10 gap.

## Counts against the rows

Rows per requirement (counted from the tables): 19, 8, 14, 14, 6, 7, 8, 6, 16 = 98; P 46, N 52;
integration 94, restraint 4. The Counts section matches every cell. Fail S1 31 and Fail S2 29 match
the per-row state values. The 80 + 11 + 3 + 4 = 98 reconciliation is correct (15 split rows for 4
criteria). Story membership: 48 + 50 = 98.

## State before the build: values I believe wrong

None found. Checked every row: story 1 against an empty `app/` (exit 1, "Cannot find module" on
stderr, nothing on stdout) and story 2 against main with story 1 built (`done` and `drop` unknown:
exit 2, usage on stderr, nothing on stdout, file untouched). The 17 story-1 `passes` rows hold their
assertion under exit 1, non-empty stderr, empty stdout and an unchanged disk. The 21 story-2 `passes`
rows hold under exit 2 with the file untouched (T-REQ-03-N5 and T-REQ-04-N5 assert no exit code and
rely on story 1's `list`). The "against the empty tree" paragraph (26 fail, 24 pass for story 2) also
recounts correctly. G5-A-02's repair is present: T-REQ-01-P8 now asserts `list` exits 0.

## `.expect` lists

- `eval/stories/1.expect`: 31 lines. Equals exactly the story-1 rows marked `fails` (17 REQ-01, 6
  REQ-02, 5 REQ-05, 3 REQ-06). None of the 17 `passes` rows is listed. No `cannot run` rows exist.
- `eval/stories/2.expect`: 29 lines. Equals exactly the story-2 rows marked `fails`. None of the 21
  `passes` rows is listed.

## What a test may assert: rows whose Then asserts a technical choice

Only one row, T-REQ-01-N7 (G5-2-A-01, quoted above). Other candidates examined and cleared:

- Exit codes 0, 1 and 2 are business outcomes here: the PRD states each per criterion (not HTTP
  statuses).
- `shelf.json` by name is the PRD's own file (section 2, section 6), not an implementation module.
- T-REQ-01-N6 ("no temporary file, no other file and no subdirectory is left") and T-REQ-08-N1
  ("no temporary file left") assert only that nothing but `shelf.json` exists or changed. They trace to
  REQ-01 c8, REQ-08 c4 and the PRD's Failed command definition. They do not require the temporary-file
  write method.
- The four words `add`, `list`, `done`, `drop` in the usage rows (T-REQ-05-P1, P2, P3, N2, N3,
  T-REQ-06-N6) are the user's narrowing D11 / PRD section 6, and Usage is defined as listing them.
- No row names a module, function, locator, library or a call that was or was not made.
- Rows stage `shelf.json` in the blueprint's section 7 shape in their Given; that is staging, not a
  Then.

## Commands against RUNTIMES.md

Fits, with the one format point in G5-2-A-02. Checked: `eval/report/` deleted at the start; the
conventions step fails the run before `rows.txt` is written; `eval/deferred.txt` read before any row
runs; a line with no `D-<k>` defers nothing; the verdict run uses `--test-skip-pattern` with the whole
id escaped and its exit status is the verdict; a second run of the listed rows only uses
`--test-name-pattern`, exit status ignored; `deferred <id> D-<k> <reason>` for a failing listed row,
`pass <id>` plus the gate's note for a passing one, a fail for a skipped or unfinished one;
`fail <id> skipped` only for a row skipped inside the verdict run, never for one left out by the
pattern; `fail <id> did not run` for ids of an existing story file missing from the report;
`fail <step> <reason>` for a step failing after the rows or a crash; `eval/report/` ignored by git;
`eval/runtime` is `node 22`.

## Blueprint cross-checks

- Conventions step: the plan's section 3 table matches blueprint section 13 items 1 to 5 (npm,
  ESLint 9.39.1 with `@eslint/js` 9.39.1, Prettier 3.6.2, `forbidden-in-app.sh` and `.txt`,
  `layout-check.sh`), their configuration files and their binding sections. It has no id, Given/When/
  Then or state, and declines types, audit, secret scan and container lint as the blueprint does.
- Stories: the plan's section 6 matches blueprint section 9.
- Open points and accepted limitations: Open point 1 (versions, registry) and Open point 2 (permission
  rows) are carried; D6 and D7 limitations are recorded in Gaps as needing no row.

## Preparation state cross-checks

Q10 (permission gap), Q14 narrowed by D11, Q15 (argument errors win), D10 (create-then-edit) are
reflected correctly in the plan. The change log's claims (G5-B-01, G5-A-01, G5-A-02, D10, D11, no row
added or removed, `.expect` lists unchanged) are true of the file.
