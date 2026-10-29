# Gate 6 planning review: shelf

Reviewer: a session started for this task. Rubric: `docs/orchestrator/rubrics/review.md`.

Inputs read: PRD revision 7, mockup revision 5, blueprint (TECH-SPEC) revision 7, eval plan revision 3, the
four rubrics (review, prd, blueprint, eval-plan), `ORCHESTRATOR.md` sections 4, 6 and 7, `RUNTIMES.md` "What
the gate needs from any runner", `PRACTICES.md`, and from `PREPARATION-STATE.md` only "Gate 1", "Questions
asked, and the answers" (Q1 to Q19) and "Decisions" (D1 to D11). No earlier findings file was read.

What I could not do: I had no shell, so I ran nothing. Every statement about how ESLint, Prettier, `grep`,
`node --test` or Node's start-up error behave is from knowledge, not from a run here, and is marked so where
it matters. I did not read the implementation (there is none) or any file under `eval/`.

Result in one line: 0 blockers, 6 advisories. The `.expect` list for story 1 is right against an empty `app/`.

---

## 1. Each artifact against its own rubric

### 1.1 PRD (rubric `rubrics/prd.md`), checker's verdict

- Numbering: REQ-01 to REQ-09 each appear once, no holes. Criteria per requirement: 14, 7, 14, 14, 5, 7, 5, 4,
  10 = 80. Every criterion sits under exactly one requirement, none outside. Pass.
- Per requirement (traced to a user statement / criteria observable / role prohibitions / input-failure cases):
  - REQ-01: yes / yes / yes (REQ-05 c3 carries the search and rate refusals for the role) / yes (missing, empty,
    whitespace-only title).
  - REQ-02: yes / yes / yes / not applicable (no input that can fail).
  - REQ-03: yes / yes / yes / yes (missing, non-numeric, unknown id).
  - REQ-04: yes / yes / yes / yes.
  - REQ-05: yes (scope, Q6) / yes / yes / yes.
  - REQ-06: yes (Q1, Q13) / yes / yes / yes.
  - REQ-07: yes (scope) / yes / yes / not applicable.
  - REQ-08: yes (Q10) / yes / yes / not applicable.
  - REQ-09: yes (scope, Q9) / yes / yes / yes (invalid JSON and wrong shape).
- Criteria judged unobservable: none found.
- Undefined terms: none found. "Never-used shelf", "numeric id", "unknown id", "untouched", "usage" and "order of
  checks" are defined and the criteria use them as defined.
- Every tag I spot-checked against the record matches it (Q2 on c6/c7, Q3 on REQ-03 c3, Q7 on the "extra
  arguments" criteria, Q12 on trim, Q13 on "untouched when absent", Q15 on the argument-over-file criteria).
  No requirement, criterion or definition lacks a trace to the scope or to Q1 to Q19.
- Blockers from this rubric: none found.

### 1.2 Mockup (no rubric of its own; held to the PRD rubric and ORCHESTRATOR gate 3)

- Demonstrates every journey the PRD claims: the Coverage table accounts for all 80 criteria, and I checked each
  transcript against its criterion. Each exit code and printed line matches the PRD.
- Claims no journey the PRD lacks: none found. No command, option or output line beyond the PRD.
- Usage placeholder `<usage: lists add, list, done, drop>` agrees with D11 and the Usage definition.
- Blockers: none found.

### 1.3 Blueprint (rubric `rubrics/blueprint.md`), checker's verdict

- Any requirement ID originating in the blueprint: none found. It uses REQ-01 to REQ-09 only.
- Requirements placed exactly once: yes (Rules: REQ-01 to 05; Store: REQ-06 to 09). Exceptions: none found.
- Criteria with no register row: none found (80 rows, one per criterion, same keys).
- Register rows whose evidence is an agent's claim: none found. Evidence is each row's `rows.txt` line.
- Requirements accepting input with no failure behaviour: none found (section 5 and the message table).
- Shared objects with no concurrency answer: none found (section 8, TD-17).
- Decisions with no decider: none found in section 10.
- Concerns of PRACTICES section A with no line in section 12: none found (8 security, 8 reliability, 4
  observability, 6 delivery lines are all present), nor beyond section A.
- Conventions of section B with no tool, version or configuration file: none found. Commits and Comments name
  `git` / `commits.md` / ESLint `no-warning-comments`. Practices declined carry a sentence and a decider.
- Layout tree and size limits present: yes (300, 50, 10 with the three ESLint rules).
- Findings below the PRACTICES recommendation without a recorded reason: none found. Each decline cites Q18
  item 6 / D9.
- Blockers from this rubric: none found.

### 1.4 Eval plan (rubric `rubrics/eval-plan.md`), checker's verdict

- Requirements missing a P or an N test: none found (REQ-01 11P/8N, 02 6/2, 03 5/9, 04 5/9, 05 3/3, 06 1/6,
  07 4/4, 08 3/3, 09 8/8).
- Tests with no or an unknown requirement: none found.
- Criteria absent from both tests and gaps: none found. The coverage table has 80 entries.
- Register rows with no test: none found.
- Criteria whose only evidence is in-process rows: none found. Every row spawns the application as a child
  process and observes stdout, stderr, exit code and bytes.
- Tests with no owner story: none found. Tests with no state-before-the-build value: none found.
- Overlapping story scope: stories 1 and 2 both name `app/shelf.mjs` and `app/src/shelf.mjs`. This is the
  accepted limitation D10 (Q19 item 1, Option A) and is recorded in section 6; it is not a finding.
- Tests depending on a later story's files: none found (section 3 below).
- Gaps section exists; Untestable section exists ("None", with the D11 reason).
- Conventions step is outside the rows, with tools, versions, configuration files and binding blueprint
  sections named. Restraint rows exist (N6, N7, N8 of REQ-01 and N3 of REQ-05).
- Counts: I recomputed them. 98 rows, 46 P and 52 N, 94 integration and 4 restraint, story 1 48 rows (31 fail,
  17 pass), story 2 50 rows (29 fail, 21 pass). The `80 + 11 + 3 + 4 = 98` sum is right.
- Blockers from this rubric: none found.

---

## 2. Across the artifacts

### 2.1 Ids and the mapping

- Every REQ in the blueprint, the mockup and the plan exists in the PRD. None invented.
- Every register row has a plan row. The plan's mapping table (section 5) has 80 criterion entries, the same keys
  as the register, and I checked each pair against the row's own "(REQ-nn cn)" tag. They match. Four restraint
  rows have no register row, and the plan says so.
- Row ids are `T-REQ-nn-P<k>` / `N<k>` in the plan, `T-REQ-nn-…` in the blueprint. Consistent.

### 2.2 Exit codes, order of checks, usage words

- Exit codes: the PRD criteria, mockup, blueprint TD-10 and the message table, and the plan rows agree. 2 for an
  unknown or missing command, a missing or empty title, a missing or non-numeric id (including `""`); 1 for an
  unknown id (including `0`, `007` with no book 7, and any id with no file) and for an unreadable, corrupt or
  unwritable file; 0 otherwise.
- Order of checks (D1, Q15): the PRD definition, blueprint TD-4 and section 2, mockup transcripts, and the plan's
  N4, N5, N6, N7, N9 and REQ-05 N2 agree. A numeric id with a corrupt file exits 1 in all four (REQ-09 c3, c7).
- Usage-words rule (D11): the PRD section 6 sentence, blueprint section 4 and TD-5, and plan sections 1 and 8
  agree on which rows carry the four-word check: REQ-05 c1, c2, c3, c5 and REQ-06 c7, that is plan rows
  T-REQ-05-P1, P2, P3, N2 and T-REQ-06-N6. The restraint row T-REQ-05-N3 also checks it. REQ-05 c4 (T-REQ-05-N1)
  does not, in both the register and the plan. The only other "never its words" sentences (blueprint lines 60
  and 159) both carry the D11 exception.
- Stories and files (D10): PRD section 7, blueprint section 9 and plan section 6 agree. Story 1 creates the three
  files; story 2 edits `app/shelf.mjs` and `app/src/shelf.mjs` only and never `store.mjs`. Plan section 6 and
  blueprint section 9 both say story 2's scope file names only those two.
- Conventions step: the order (install, ESLint, Prettier, forbidden-in-app, layout), the versions (ESLint and
  `@eslint/js` 9.39.1, Prettier 3.6.2), the commands and the files (`package.json`, `package-lock.json`,
  `eslint.config.mjs`, `prettierrc.json`, `prettierignore`, `forbidden-in-app.sh`, `forbidden-in-app.txt`,
  `layout-check.sh`) are the same in blueprint section 13 and plan sections 2 and 3. `commits.md` is in the
  blueprint only, correctly, since no tool runs on it.
- Permission-row gap: blueprint section 4 and Open points 2, and plan sections 2 and 8 and Open points 3, agree
  on the same ten criteria (REQ-07 c1 to c5, REQ-08 c1 to c4, REQ-03 c12) and the 15 rows they become. All three
  say a root gate cannot stage them. See R6-002 and R6-003 for what is left open.

### 2.3 No scope beyond the record

- Each PRD criterion traces to the scope or Q1 to Q19. Each blueprint decision names a decider (the user, a
  recorded default, or a PRD clause), and the recorded defaults that add behaviour are labelled as such (TD-11
  `shelf: unexpected error`, the extra wrong-shape checks in TD-7, the temporary-file write accepted at Q18
  item 1). The plan adds four restraint rows, which the rubric requires, and each traces to a PRD clause or
  non-goal. No artifact adds a command, option, field or behaviour the reader can see that the record lacks.
  None found.

### 2.4 Open points and the freeze

- Blueprint Open points 1 and 2 and plan Open points 1, 3, 4 and 5 are listed; the rest are closed by D5 to D8
  and D10. The listed ones do not block the tests-as-code, the runner, `eval/runtime` (`node 22`, which matches
  RUNTIMES.md and the `--test-skip-pattern` need of Node 22.1 or later), the story-1 `.expect` or the pull
  request.
- Points that are not listed anywhere and touch gate 7 are R6-001, R6-002 and R6-004 below.

### 2.5 The `.expect` list for story 1 against an empty `app/`

State: `node app/shelf.mjs` does not exist, so the child exits 1 with Node's error on stderr and nothing on
stdout (non-root runner). I went through all 48 story-1 rows.

- Listed `fail` rows, 31: REQ-01 P1, P2, P3, P4, P5, P6, P8, P10, P11 and N1 to N8 (17); REQ-02 P1, P2, P4, P5,
  P6, N1 (6); REQ-05 P1, P2, P3, N2, N3 (5); REQ-06 P1, N4, N6 (3). Each asserts an exit 0, an exit 2, stdout
  text, or a file's existence, none of which an exit 1 with empty stdout gives. Correct.
- Unlisted `passes` rows, 17: REQ-02 N2, REQ-05 N1, REQ-06 N1, REQ-07 P1, P2, N1, N2, REQ-08 P1, N1, REQ-09
  P1, P2, P5, P6, N1, N2, N5, N6. Each asserts only exit 1, stderr non-empty, stdout empty, or unchanged bytes or
  an unchanged directory, which an exit 1 with empty stdout satisfies. Correct.
- No row is unlisted and failing, none is listed and passing, and there are no duplicates. Story 1 has 48 rows,
  31 plus 17. No story-1 row is `cannot run`.
- On a root runner, the six permission rows T-REQ-07-P1, P2, N1, N2 and T-REQ-08-P1, N1 would fail with
  `cannot stage: running as root` and so be unlisted failures. The plan says so (section 6). See R6-002.
- The story-2 list (29 fail, 21 pass, against main with story 1 merged) also checks out, and so does the "for
  the record" figure of 26 fail and 24 pass against the empty tree. It is not part of the freeze.

---

## 3. Sequencing

- No story is asked to prove something that does not exist yet. Story 1 rows use only `add`, `list`, the
  unknown-command path and staged files. The rows that would need `done` or `drop` in their Given (REQ-01 c6 and
  c7, REQ-02 c2) have a staged form owned by story 1 and a real-command form owned by story 2 (P7, P9,
  REQ-02 P3).
- No row needs a file that a later story creates. Story 2 rows use story 1's `add` and `list`. The shared
  `eval/tests/harness.mjs` belongs to the freeze, not to a story.
- There are no combined or journey rows, so nothing needs to come after the stories that supply it.
- Findings: none found.

## 4. Ownership

- Every row has exactly one owner story (48 + 50 = 98, no overlap, none missing).
- Files: story 1 creates three, story 2 edits two of them. The disjoint-scope rule is not met in the strict
  sense; the user accepted that (D10), so it is not a finding.
- Findings: none found, apart from R6-005 (story 1's scope file is never named).

---

## 5. Findings

### R6-001
- severity: advisory
- description: "An empty `app/` passes" the conventions step is stated as fact. Two things make it uncertain on
  the stated commands: Prettier and ESLint are given the directory `app` with no flag for "no matching files",
  and `grep -rEnf … app` needs `app` to exist; yet git does not keep an empty directory, and the layout check
  fails if `app/` holds any file other than the three of D2, so a placeholder file is not allowed either. Nothing
  says how `app/` exists on main before story 1. I did not run these tools; from knowledge, Prettier 3 exits
  non-zero for a pattern that matches no files, and ESLint 9 does the same for a directory with no lintable file.
- basis: TECH-SPEC section 13: "An empty `app/` passes." and "`eslint --config eval/conventions/eslint.config.mjs
  app`", "`prettier --check … --no-editorconfig app`", "`grep -rEnf eval/conventions/forbidden-in-app.txt app`";
  layout check: "or if `app/` holds any file other than the three of D2". Eval plan section 6: "nothing (main has
  an empty `app/`)". Open point 1 covers only "the exact ESLint invocation (the base path when `--config` is
  given)", not Prettier, grep, or an absent `app/`.
- resolution: blueprint-change
- cost: if it fails, the conventions step stops `eval/run.sh` before `rows.txt` is written, so no row of story
  1's packet (31 expected failures, 17 expected passes) can be reported as expected at the gate-7 empty-tree run
  or in `pod-works preview`. No test is unwritable and no criterion becomes unobservable. The existing Open point
  1 already promises that gate 7 proves the invocation by running it, so this is found there, not hidden; it is
  advisory for that reason.

### R6-002
- severity: advisory
- description: Whether the gate machine runs as root, which decides if the 15 permission rows run or fail, is
  left to the founder in a "Gaps" bullet and appears in neither document's list of open points. The
  `.expect` files and the "passes" claims assume non-root. The blueprint says GitHub's hosted runner is
  non-root, which would settle it for the real gate, but the plan still says the founder "should decide".
  Q10 asks that the plan record the gap; the plan records it as a failing run on a root gate, not as a gap
  that leaves the run green, and blueprint Open points 2 says how a gap shows in a run is "Undecided".
- basis: Eval plan section 8: "The founder should decide which kind of gate the project uses before story 1 is
  packeted, since the expect files assume non-root (section 6)." Section 10 point 3: "`rows.txt` has no entry
  for 'cannot run'." TECH-SPEC Open points 2: "Undecided: how a gap shows in a run, since `rows.txt` and
  `eval/deferred.txt` (which needs a defect id from the founder) have no entry for 'cannot run'."
- resolution: user-decision
- cost: on a root gate, REQ-07 c1 to c5, REQ-08 c1 to c4 and REQ-03 c12 (ten criteria, 15 rows) cannot be
  observed and fail the run; six of those rows are in story 1 (so story 1's `.expect` would be wrong: six
  unexpected failures) and nine in story 2 (five of them additional to its `.expect`). On the hosted non-root
  runner there is no cost. I cannot state what a root gate would cost to the founder beyond these rows.

### R6-003
- severity: advisory
- description: The plan attributes the root-gate gap handling for all ten permission criteria to Q10. Q10 covers
  only the unwritable case (REQ-08). The blueprint states the difference correctly: for REQ-07 and REQ-03 c12 it
  is a recorded default, not the user's direction.
- basis: Eval plan section 8: "The ten criteria REQ-07 c1 to c5, REQ-08 c1 to c4 and REQ-03 c12 … This is a
  recorded gap, as Q10 directs". PREPARATION-STATE Q10: "`shelf.json` cannot be written on `add`, `done` or
  `drop`? … treated like the unreadable case". TECH-SPEC section 4: "for REQ-08 that is the user's direction, and
  this blueprint applies the same treatment to REQ-07 and REQ-03 c12 as a recorded default."
- resolution: plan-correction

### R6-004
- severity: advisory
- description: `npm ci --prefix eval/conventions` creates `eval/conventions/node_modules`, but the only git
  ignore the plan names is `report/` in `eval/.gitignore`. No artifact says `node_modules` there is ignored. A
  gate-7 run on a developer machine would leave it untracked in a pull request that must change nothing outside
  `docs/` and `eval/` except what is meant. The layout check looks for `node_modules` only under `app/` and at
  the root, not here.
- basis: Eval plan section 2 "Git": "`eval/report/` is ignored by git (`eval/.gitignore` holds `report/`)."
  TECH-SPEC section 13 layout: `conventions/` is listed with "package.json, lockfile and configuration" and no
  ignore.
- resolution: plan-correction

### R6-005
- severity: advisory
- description: ORCHESTRATOR gate 7 requires each story's packet to carry `eval/stories/<n>.txt` (scope file) and
  `<n>.md` (brief). The plan names only `eval/stories/2.txt`, and no artifact names story 1's scope file or its
  content (the three files it creates). The blueprint's layout tree lists the `stories/` folder as holding
  only `<n>.expect` files.
- basis: ORCHESTRATOR section 4, gate 7: "story 1's packet: its rows, its scope file, its brief, and its
  expectations". TECH-SPEC section 13: "`stories/` `<n>.expect` files". Eval plan section 6: "story 2's scope file
  (`eval/stories/2.txt`) names only `app/shelf.mjs` and `app/src/shelf.mjs`"; no such sentence for story 1.
- resolution: plan-correction

### R6-006
- severity: advisory
- description: Four small statements are stale or imprecise. None changes a requirement, row or count.
  (a) The eval plan header says "Revision 3 (draft for gate 5)" though the plan is approved.
  (b) Plan Open point 4 says "The user's brief asks for `fail <id> did not run`", but the record has no such
  brief; the source is the rubric and RUNTIMES.md.
  (c) Blueprint section 9 lists REQ-08 c4 among criteria that "name all four commands"; it names three, as
  the plan says.
  (d) The PRD legend says Q5, Q9, Q10 and Q14 are accepted defaults and "the rest are the user's product
  answers", but Q16 and Q17 are recorded as technical choices and Q18 is partly defaults. The PRD cites none of
  Q16 to Q18, so nothing depends on it.
- basis: (a) eval-plan.md line 3. (b) eval-plan.md section 10 point 4. (c) TECH-SPEC section 9: "Criteria that
  name all four commands (REQ-07 c5, REQ-08 c4, REQ-09 c9 and c10)" against PRD REQ-08 c4 ("In each case
  nothing is changed on disk") and plan section 1 "REQ-08 c4 (three commands)". (d) PRD header; PREPARATION-STATE
  Q16 to Q18 "Kind" column.
- resolution: plan-correction

---

## 6. Verdict

Counts by severity: blockers 0; advisories 6 (R6-001 to R6-006).

Counts by resolution class: plan-correction 4 (R6-003, R6-004, R6-005, R6-006); user-decision 1 (R6-002);
blueprint-change 1 (R6-001).

What the user-decision and blueprint-change findings block, and how much:

- R6-001 (blueprint-change). Blocks: the conventions step on the empty `app/` and so the gate-7 empty-tree run
  and the `pod/preview` check of story 1's packet, if the tools behave as I expect from knowledge. Tests that
  cannot be written: none. Story affected: story 1's packet (31 expected-fail and 17 expected-pass rows are not
  reportable while the step fails). Criterion left unobservable: none. Cost to repair: I cannot state it; it
  depends on running the tools, which I did not do and which Open point 1 already assigns to gate 7.
- R6-002 (user-decision). Blocks: the evidence of REQ-07 c1 to c5, REQ-08 c1 to c4 and REQ-03 c12 on a gate that
  runs as root. Tests: 15 rows (six in story 1, nine in story 2). Stories affected: both; story 1's `.expect`
  is wrong by six rows on a root gate. Criteria left unobservable on a root gate: those ten. On the hosted
  non-root runner nothing is blocked. I cannot state a cost beyond this, because the choice of gate machine
  is the founder's.

Outcome: **No blockers.** The plan may go to the user for acceptance, with the six advisories listed. The
advisories are not scope and add none; R6-002 needs the user's answer on which kind of gate machine the project
uses before story 1 is packeted, and R6-001 needs to be proved at gate 7.
