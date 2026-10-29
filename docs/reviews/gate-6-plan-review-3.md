# Gate 6 planning review 3: shelf

Whole-plan review against `docs/orchestrator/rubrics/review.md`, in a fresh session, after a
correction pass.

Inputs read: PRD revision 8, mockup revision 6, blueprint (TECH-SPEC) revision 9, eval plan
revision 5; the rubrics `prd.md`, `blueprint.md`, `eval-plan.md`, `review.md`; ORCHESTRATOR.md
sections 4 (gates 3 to 7), 6 and 7; RUNTIMES.md "What the gate needs from any runner"; PRACTICES.md;
and from `docs/PREPARATION-STATE.md` only "Gate 1", "Questions asked, and the answers" (Q1 to Q19)
and "Decisions" (D1 to D11). No earlier findings file was read. To check one factual claim of the
eval plan (Open point 6) I also read `.github/workflows/pod-gate.yml`, `.github/scripts/gate.sh`,
`.github/scripts/runtime.sh` and the root `.gitignore`. No application code exists, and none was
read.

## Verdict

Counts by severity: **blockers 0, advisories 6** (R3-001 to R3-006).
By resolution: plan-correction 5, user-decision 1, blueprint-change 0.

**No blockers.** The plan may go to the user for acceptance, with the advisories listed. The one
`user-decision` advisory (R3-005) has a stated cost below; the user's answer to it is expected in
`docs/decisions-2026-10-28.md`, whose absence now is not a finding.

### Cost of every user-decision and blueprint-change finding

- **R3-005 (user-decision, advisory): whether the gate runs as root, and how a "cannot run" gap shows.**
  - Blocks, if the gate runs as root: the proof of 10 criteria (REQ-07 c1 to c5, REQ-08 c1 to c4,
    REQ-03 c12), carried by 15 rows: T-REQ-07-P1 to P4 and N1 to N4, T-REQ-08-P1 to P3 and N1 to N3,
    T-REQ-03-N7. Story 1 is affected in 6 rows (T-REQ-07-P1, P2, N1, N2; T-REQ-08-P1, N1), which would
    fail `cannot stage: running as root` although `.expect` omits them, so the story 1 preview
    would report 6 unexpected failures. Story 2 is affected in 5 rows (T-REQ-03-N7, T-REQ-07-N3, N4,
    T-REQ-08-N2, N3); its other 4 permission rows already fail by design. Each failing row needs a
    founder-supplied defect id `D-<k>` in `eval/deferred.txt` to stop failing the run.
  - Blocks, if the gate runs non-root: nothing. `.github/workflows/pod-gate.yml` runs on
    `ubuntu-latest` with no `container:` line, which is the hosted non-root runner the plan assumes.
  - Cost of the answer itself: one yes/no from the user. I cannot state a cost for the
    "how a gap shows" half beyond that, because no input says what the gate does with a gap.
- No `blueprint-change` finding.

## 1. Each artifact against its own rubric

### 1.1 PRD (rubric `prd.md`, checker's verdict)

Numbering: REQ-01 to REQ-09 each appear once, no holes. Every criterion sits under exactly one
requirement. Criteria per requirement: 14, 7, 14, 14, 5, 7, 5, 4, 10 = 80, matching the stated 80.
No criterion is outside a requirement. **Numbering blockers: none found.**

| Requirement | Traced to a user statement | Criteria all observable | Role prohibitions present | Input-failure cases present |
|---|---|---|---|---|
| REQ-01 | yes (scope, Q1, Q2, Q4, Q8, Q11 to Q13, Q15) | yes | not applicable (single role; the prohibition is REQ-05 c3) | yes (missing, empty, whitespace-only title) |
| REQ-02 | yes (scope, Q1, Q7) | yes | not applicable | not applicable (extra arguments are ignored, c7) |
| REQ-03 | yes (scope, Q3, Q5, Q7, Q11, Q13, Q15) | yes | not applicable | yes (missing, non-numeric, empty-string, unknown) |
| REQ-04 | yes | yes | not applicable | yes |
| REQ-05 | yes (scope, Q6, Q11, Q13, Q15) | yes | yes (c3: `search`, `rate` refused) | yes (unknown word, no word) |
| REQ-06 | yes (Q1, Q13) | yes | not applicable | yes (c5 to c7) |
| REQ-07 | yes (scope) | yes | not applicable | yes (file unreadable, four commands) |
| REQ-08 | yes (Q10, an accepted default, tagged as such) | yes | not applicable | yes |
| REQ-09 | yes (scope, Q9) | yes | not applicable | yes (invalid JSON, wrong shape) |

Criteria judged unobservable: **none found.** Undefined terms: **none found.** Every term in a
criterion (Numeric id, Unknown id, Untouched, Failed command, Usage, Order of checks, Corrupt,
Unwritable) is defined in section 4. Technical content in criteria: only the user's own file name
`shelf.json`, the user's exit codes and stdout/stderr, all in the scope.
Open questions (section 8): none; matches the state's empty open-question table. One citation
defect: R3-003.

### 1.2 Mockup (rubric: gate 3 and the PRD rubric's "mockup demonstrates the PRD's journeys and no others")

All 80 criteria appear in a transcript or a stated file state, and the Coverage table says so
(six criteria by file state alone, correctly listed: REQ-02 c5, REQ-05 c4, REQ-07 c5, REQ-08 c4,
REQ-09 c9 and c10). I found no transcript for a journey the PRD lacks, no added command, option or
output line, and no transcript whose output or exit code contradicts the PRD. Specific checks: `done 007`
prints `done 7 Ulysses`; `shelf done` against an unreadable file exits 2; `shelf add ""` and `shelf add`
against corrupt JSON exit 2; usage placeholder lists the four words. **Findings: none found.**

### 1.3 Blueprint (rubric `blueprint.md`, checker's verdict)

- Any requirement ID originating in the blueprint: **none found** (header: "this document creates none").
- Requirements placed exactly once: REQ-01 to REQ-05 under Rules, REQ-06 to REQ-09 under Store;
  exceptions: **none found**.
- Criteria with no register row: **none found** (80 rows, same keys as the PRD).
- Register rows whose evidence is an agent's claim: **none found** (every row's evidence is its
  `rows.txt` line, or for the permission rows the recorded gap).
- Requirements accepting input with no failure behaviour: **none found** (section 5 and the message table).
- Shared objects with no concurrency answer: **none found** (section 8, TD-17).
- Decisions with no decider: **none found**; one decider is mislabelled (R3-002).
- Section A concerns with no line in section 12: **none found** (8 security, 8 reliability, 4
  observability, 6 delivery and data, each answered on its own line).
- Concerns beyond section A with no line: **none found** (section 12 lists seven).
- Section B conventions with no tool, version or configuration file: **none found.** Types, Logging,
  Configuration and The client are declined in one sentence each; Commits names `git` (unpinned, with the
  reason that no check runs on it) and `eval/conventions/commits.md`.
- Section B practices neither made concrete nor declined: **none found.**
- Conventions section lacks a layout tree or size limits: **no, both present** (300, 50, 10 with the
  three ESLint rules).
- Production-readiness defaults below the PRACTICES recommendation without a recorded reason:
  **none found.** The departures (input validated in the rules layer, no file lock, no logs, no
  configuration, no audit or secret scan, no builder tests) each carry a reason and a decider (D9, D5,
  or the stated recorded default).

### 1.4 Eval plan (rubric `eval-plan.md`, checker's verdict)

- Requirements missing a P or an N test: **none found** (each of REQ-01 to REQ-09 has both).
- Tests with no or an unknown requirement: **none found.** The four restraint rows sit under REQ-01 and
  REQ-05 and name their PRD non-goals.
- Criteria absent from both the tests and the gaps: **none found.** I mapped all 80 criteria through the
  section 5 table to rows that exist in section 4.
- Register rows with no test: **none found** (80 and 80, same keys).
- Criteria whose only evidence is in-process rows: **none found.** Every row starts `node app/shelf.mjs`
  as a child process and none imports `app/`.
- Tests with no owner story: **none found.** Section 6 lists 48 plus 50 rows; I checked every row id of
  section 4 appears in exactly one list and that the Owner column agrees.
- Tests with no state-before-the-build value: **none found.**
- Overlapping story scope: **present, and resolved.** Stories 1 and 2 both name `app/shelf.mjs` and
  `app/src/shelf.mjs`. The rubric entry stands; the gate-6 route is "recorded as an accepted
  limitation", and D10 (Q19 item 1, Option A, the user) records exactly this, with story 2's scope
  file naming only those two files. Reported here as accepted under D10, not as a finding.
- Tests depending on a later story's files: **none found.**
- Gaps and untestable sections exist: **yes**, section 8 and section 9 ("None", with the D11 reason).
- Counts: re-added from the table, **all correct.** P 46, N 52, integration 94, restraint 4, total 98;
  fail before build S1 31 and S2 29 (60), pass 17 and 21 (38); 80 + 11 + 3 + 4 = 98; 15 permission rows
  for 10 criteria; story 2 against the empty tree 26 fail and 24 pass.
- The conventions step: a heading of its own, no test id, tools with versions and configuration files,
  and the blueprint item that binds each. Present and correct.

## 2. Across artifacts

- **Id consistency.** Every `REQ-nn` in the blueprint and the eval plan is a PRD id. Row ids follow
  `T-REQ-nn-P<k>` and `N<k>`; every id used in section 5, section 6 and both `.expect` lists exists
  in section 4. **No inconsistency found.**
- **PRD criteria reach the blueprint's register and the eval plan's tests.** 80, 80, 80 criteria mapped
  (the eval plan maps all 80 to rows). **No inconsistency found.**
- **Exit codes.** PRD (argument errors 2, unknown id 1, file errors 1), blueprint TD-10 and the message
  table, mockup, and every eval row (for example T-REQ-03-N3 and N4 refused (1), N9 refused (2),
  T-REQ-06-N2 refused (1)) agree.
- **Order of checks.** PRD section 4, blueprint section 2, TD-4 and section 12, the mockup (REQ-01 c13 and
  c14, REQ-03 c11 and c12, REQ-04 c11 and c14, REQ-05 c5) and the eval rows (T-REQ-01-N4, N5, T-REQ-03-N6,
  N7, T-REQ-04-N6, N9, T-REQ-05-N2) agree. The eval plan records that the rows test the PRD's samples only.
- **Usage-words rule (D11).** PRD section 6 and the Usage definition, blueprint section 4 and TD-5, and the
  eval plan (T-REQ-05-P1, P2, P3, N2, N3, T-REQ-06-N6; section 8; section 9) agree on the same rows,
  REQ-05 c1, c2, c3, c5 and REQ-06 c7. The mockup placeholder carries the four words. T-REQ-05-N3 also
  checks the four words, which D11 allows ("unknown-command cases"). No other wording is checked.
- **Stories, files and packet files (D10).** Blueprint section 9 and layout tree, and eval plan section 2
  and section 6 agree: story 1 creates the three files, story 2 edits `app/shelf.mjs` and
  `app/src/shelf.mjs` only and never `store.mjs`; `eval/stories/<n>.txt`, `<n>.md`, `<n>.expect`; story 2's
  set ships with its packet after story 1 merges; story 1's `.txt` lists three files, story 2's two.
  Agree with D10.
- **Conventions step: tools, files, guard.** Same five tools (npm, ESLint 9.39.1 with `@eslint/js`
  9.39.1, Prettier 3.6.2, `forbidden-in-app.sh` with `.txt`, `layout-check.sh`), same configuration
  files under `eval/conventions/`, same commands. The guard is the same in both: `app/` absent or with
  no `.mjs` file prints one line, skips the install, ESLint, Prettier and both checks, and the step
  passes; gate 7 proves it against the empty tree. The numbering differs by one (blueprint steps 1 to 5,
  eval-plan steps 2 to 6, because the eval plan's step 1 is deleting the report directory), and each
  document names the skipped tools, so they agree. Open point listing: R3-006.
- **Where the ignore lines live.** Blueprint revision 9 and eval plan section 2 "Git" agree:
  `eval/.gitignore` holds `report/` and `conventions/node_modules/`; nothing outside `docs/` and
  `eval/` is touched by the freeze. The root `.gitignore` already holds `eval/report/` (stamped by the
  gate setup), so the duplicate `report/` line causes no conflict.
- **The permission-row gap and who decided which part.** Blueprint section 4 and TD-19, and eval plan
  section 8, agree: handling REQ-08 c1 to c4 as a gap is the user's direction (Q10); the extension to
  REQ-07 c1 to c5 and REQ-03 c12 is a recorded default of the blueprint, not Q10's words. The ten
  criteria and 15 rows match across the two documents. The unresolved part is R3-005.
- **No scope beyond the record.** Every PRD criterion carries a source tag that resolves to the scope,
  an answer or a decision of the same content (checked against Q1 to Q15, Q19, D11). Blueprint additions
  with no PRD criterion (the extra wrong-shape checks, TD-11, TD-12, TD-13, TD-17, the field names) are
  each labelled a recorded default, open to the user, or traced to Q9, D4, D6 to D9. The eval plan's four
  restraint rows trace to the PRD's non-goals. **Found none beyond the record.** One citation defect in
  the PRD: R3-003.
- **Every open point listed.** Blueprint Open points 1 and 2 (3 to 7 are closed); eval plan Open points 1
  to 6; PRD none. Listed in section 5 of this file. One omission: R3-006.
- **Story 1's `.expect` list against an empty `app/`.** Checked row by row. Against a child process that
  exits 1 with `Cannot find module` on stderr and empty stdout, the 31 listed rows each assert an exit
  code 0 or 2, a printed line, or a `list` output, and so fail; the 17 unlisted story 1 rows (T-REQ-02-N2,
  T-REQ-05-N1, T-REQ-06-N1, T-REQ-07-P1, P2, N1, N2, T-REQ-08-P1, N1, T-REQ-09-P1, P2, P5, P6, N1, N2, N5,
  N6) assert only exit 1, non-empty stderr, empty stdout, or an unchanged disk, and so pass. The list
  has exactly 31 lines, none is repeated, and each is a story 1 row. The guard lets the rows run with
  `app/` absent or empty, so the conventions step adds no failure line. Story 2's list (29 lines) was
  also checked against main with story 1 merged (`done` and `drop` as unknown commands) and is correct.
  **No defect found.** The 15 permission rows assume a non-root runner (R3-005).

## 3. Sequencing

No story is asked to prove something that does not exist yet. No story 1 row uses `done` or `drop`
(T-REQ-01-N8 uses the words as title text). The three rows that need real `done` or `drop`
(T-REQ-01-P7, P9, T-REQ-02-P3) are story 2's, with story 1 twins that stage the state (P6, P8, T-REQ-02-P2).
No row needs a file a later story creates; the shared `eval/tests/harness.mjs` is frozen with the first
pull request. Combined checks (the four-command rows for REQ-07 c5, REQ-08 c4, REQ-09 c9 and c10) are
split by command, so each half follows the story that supplies its command. **Findings: none found.**

## 4. Ownership

Every one of the 98 rows has exactly one owning story. `app/src/store.mjs` has one owner (story 1).
`app/shelf.mjs` and `app/src/shelf.mjs` have two (create, then edit), accepted by the user as D10 and
not reported again. Files under `eval/` belong to the freeze, not to a story, as ORCHESTRATOR.md
section 4 gate 7 says. **Findings: none found.**

## 5. Open points, listed

| Source | Open point | State |
|---|---|---|
| Blueprint 1 | Pinned versions chosen without a registry; confirmed at gate 7; exact ESLint invocation; guard proved against the empty tree; `npm ci` needs registry access | Open. Carried by eval plan OP1, except the guard proof (R3-006) |
| Blueprint 2 | Permission rows cannot run as root; how a gap shows | Open. Carried by eval plan OP3 and OP6 (R3-005) |
| Blueprint 3 to 7 | D6, D7, D8, D5 closed; TD-18 decided | Closed |
| Eval plan 1 | Pinned versions and invocation | Open, gate 7 |
| Eval plan 2 | Shared files between stories | Closed by D10 |
| Eval plan 3 | How a gap shows in a run | Open (R3-005) |
| Eval plan 4 | Where the converter takes expected row ids (plan's choice) | Open, a plan choice, not an input |
| Eval plan 5 | 38 rows pass before their story is built | Stated limitation of the freeze |
| Eval plan 6 | Whether the gate machine runs as root | Open; user answer expected in the gate 6 decisions file |
| PRD section 8 | none | None open |

## 6. Findings

**R3-001** advisory, plan-correction.
- Description: the eval plan header says blueprint revisions after revision 4 changed no register row, but
  the blueprint's own revision 6 changed five register rows.
- Basis: eval plan header: "revisions after PRD 5 and blueprint 4 changed no requirement, criterion or
  register row". Blueprint change log, revision 6: "register rows REQ-05 c1–c3, c5 and REQ-06 c7 carry the
  four-word check"; revision 5 says "The register is unchanged" and the eval plan's own revision 2 says
  the D11 rows were amended. The row set is unchanged (80); the mechanism text of five rows is not.

**R3-002** advisory, plan-correction.
- Description: the blueprint credits the layout check's "fail on any other file under `app/`" to the user
  (D5), but D5 is a recorded default the user accepted, which the same blueprint says elsewhere.
- Basis: TECH-SPEC section 13 step 5: "the check failing on any other file under `app/`: the user (D5)".
  PREPARATION-STATE D5, Who decided: "recorded default, accepted by the user". TECH-SPEC TD-3: "the layout
  check's: accepted by the user, Q18 item 2, D5". ORCHESTRATOR gate 2: "an accepted default is recorded as
  a default, not as a user decision".

**R3-003** advisory, plan-correction.
- Description: the PRD's Usage definition tags itself with "scope" alone, but "lists the four commands" is
  not in the scope text; it comes from Q14 (narrowed by D11).
- Basis: PRD section 4, "Usage: a stderr text that lists the four commands. [scope]". Gate 1 text: "an
  unknown command exits 2 with usage on stderr", with no list of commands. Q14: "usage naming the four
  commands". The PRD header says it cites Q1 to Q15, so Q14 is citable.

**R3-004** advisory, plan-correction.
- Description: the blueprint says rows never read the file's fields to observe titles and ids, but
  T-REQ-01-N7 parses `shelf.json` and checks the stored ids, next id, status and titles.
- Basis: TECH-SPEC section 4: "Rows observe titles and ids through `shelf list`, never by reading the
  file's fields". Eval plan T-REQ-01-N7: "`shelf.json` parses as JSON and every value in it, at any depth,
  is one of the known values: the ids `1` and `2`, the next id `3`...". N7 has no register row, so the
  register cannot carry the exception. This does not make N7 a wrong row; the two documents do not say the
  same thing.

**R3-005** advisory, user-decision. Cost stated in the Verdict above.
- Description: the plan assumes the gate machine is non-root and asks the user to confirm; if it is root,
  the 15 permission rows fail rather than show as a gap, and the plan leaves "how a gap shows" to a founder
  deferral that needs a defect id per row.
- Basis: eval plan Open point 6 ("whether the gate's machine runs as root ... The founder's answer on this is
  recorded in the gate 6 decisions file") and Open point 3 ("`rows.txt` has no entry for 'cannot run'");
  blueprint Open points 2 ("Undecided: how a gap shows in a run ... Blocks: the evidence of those 10
  rows"); Q10 ("if the test cannot run on the gate's machine, the eval plan records it as a gap").
  Supporting fact: `.github/workflows/pod-gate.yml` has `runs-on: ${{ needs.prepare.outputs.runner ||
  'ubuntu-latest' }}` and no `container:`.

**R3-006** advisory, plan-correction.
- Description: blueprint Open point 1 includes a gate 7 obligation (prove the guard by running the suite
  against the empty tree) that the eval plan's Open point 1 does not list; it is stated only in eval plan
  sections 2 and 3.
- Basis: TECH-SPEC section 11 item 1: "the guard of section 13 step 0 is proved by running the suite
  against the empty tree". Eval plan section 10 item 1 lists only "Pinned versions ... and the exact ESLint
  invocation".

## 7. What I could not judge

- The eval plan header calls the PRD and blueprint "approved". My permitted inputs hold no record of an
  approval, so I did not check it.
- I did not run any command. The pinned versions, the lockfile, the ESLint and Prettier invocations and
  the guard are not proved here, which the plan itself assigns to gate 7.
- Whether `ubuntu-latest` hosted runners stay non-root is a platform fact I took from the plan and the
  workflow file, not from a run.
- No row code exists, so "rows observe from outside" is checked against the plan's wording only.
