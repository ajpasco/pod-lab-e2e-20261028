# Gate 6 planning review, second review: shelf

Whole-plan review under `docs/orchestrator/rubrics/review.md`, in a fresh session.

Artifacts read: `docs/PRD.md` revision 8, `docs/MOCKUP.md` revision 5, `docs/TECH-SPEC.md` revision 8,
`docs/eval-plan.md` revision 4. Rubrics read: review, prd, blueprint, eval-plan. Process rules read:
ORCHESTRATOR.md sections 4, 6 and 7, RUNTIMES.md "What the gate needs from any runner", PRACTICES.md.

Record of what the user said: the file tool returned all of `docs/PREPARATION-STATE.md`. I used only its
sections "Gate 1", "Questions asked, and the answers" (Q1 to Q19) and "Decisions" (D1 to D11). I used
nothing else from it, and I did not open any earlier findings file under `docs/reviews/`.

## 1. Verdict

Counts by severity: 2 blockers, 3 advisories, 5 findings in all.

| Class | Blocker | Advisory |
|---|---|---|
| plan-correction | 2 (R62-001, R62-002) | 2 (R62-003, R62-005) |
| user-decision | 0 | 1 (R62-004) |
| blueprint-change | 0 | 0 |

### Cost of each `user-decision` and `blueprint-change` finding

- **R62-004 (user-decision, advisory).**
  - Blocks nothing if the gate's runner is non-root. The blueprint states that GitHub's hosted Linux
    runner is non-root.
  - If the gate runs as root, it blocks the evidence of 10 criteria (REQ-07 c1 to c5, REQ-08 c1 to c4,
    REQ-03 c12), which is 15 rows.
  - It would also make both `.expect` lists wrong: 6 more story-1 rows and 5 more story-2 rows would
    fail, so the preview could not read "as expected".
  - I cannot say which kind of gate the project uses. That is outside my inputs and the blueprint only
    asserts it, so I cannot cost the likelihood.
- No `blueprint-change` finding.

### Verdict line

**Blockers, all `plan-correction`.** The orchestrator may make one automatic correction pass, after
which a new review in a new session is required. The only `user-decision` finding is an advisory and
does not change the class of the verdict.

## 2. Findings

### R62-001: the guard for an absent or empty `app/` is defined two ways

- severity: blocker
- resolution: plan-correction
- description: The blueprint's guard skips the install together with the tools and the two checks. The
  eval plan's guard skips only the tools and the two checks, so `npm ci` still runs on an empty tree.
  Gate 7 writes one `eval/run.sh` from both documents, and no single script satisfies both. The effect
  is that the empty-tree proof either needs the npm registry and a lockfile or it does not.
- basis:
  - TECH-SPEC section 13, step 0: "skips steps 1 to 5 (the install, the tools and the two checks), and
    the step passes". Step 1 is "Install: `npm ci --prefix eval/conventions`".
  - Eval plan section 2: "**The guard on steps 3 to 6.** ... skips steps 3 to 6, and the step passes".
    Step 2 of the same list is "`npm ci --prefix eval/conventions` (the conventions step, section 3)".
    The guard sits "Before steps 3 to 6", so step 2 runs unguarded.
  - Eval plan section 3 repeats it: "the guard of section 2 skips steps 3 to 6".
  - Eval plan section 2 says the network is needed "for step 2".
  - TECH-SPEC Open points 1 says "a gate with no registry access cannot run the conventions step",
    which is untrue of the empty tree if the install is skipped.

### R62-002: the plan makes the freeze pull request edit the root `.gitignore`

- severity: blocker
- resolution: plan-correction
- description: Both artifacts place the ignore line for `eval/conventions/node_modules/` in the root
  `.gitignore` and say the freeze pull request adds it. Gate 7's exit condition says that pull request
  changes nothing outside `docs/` and `eval/`. The plan, as written, prescribes a pull request that
  fails that condition. The plan already has `eval/.gitignore`, which holds `report/` and is inside
  `eval/`.
- basis:
  - Eval plan section 2, "Git": "`eval/conventions/node_modules/` is ignored by git (a line in the root
    `.gitignore`, which the freeze pull request adds)".
  - TECH-SPEC section 13 layout: "`eval/conventions/node_modules/` is created by the install and
    ignored by git (root .gitignore)".
  - ORCHESTRATOR.md section 4, gate 7: "The pull request changes nothing outside `docs/` and `eval/`".

### R62-003: three artifacts name revisions that are not the current ones

- severity: advisory
- resolution: plan-correction
- description: The PRD is revision 8. The blueprint and the mockup say they follow PRD revision 7. The
  eval plan says it was written against PRD revision 7 and blueprint revision 7, "both approved". The
  blueprint is now revision 8. Revision 8 of each changed no criterion, but the headers are what a
  later reader uses to tell which versions agree. Revision 8 of the blueprint also adds the guard, so
  "blueprint revision 7 ... both approved" no longer describes what the eval plan binds to.
- basis:
  - TECH-SPEC line 5: "Blueprint of PRD revision 7 and mockup revision 5."
  - MOCKUP line 3: "Mockup of PRD revision 7".
  - Eval plan line 5: "Written against PRD revision 7 and blueprint revision 7 (both approved; the
    blueprint's revision 7 only corrects its header)".
  - PRD line 3: "Revision 8."

### R62-004: whether the gate runs as root is open, yet it is not in the eval plan's Open points

- severity: advisory
- resolution: user-decision
- blocks: see the cost under section 1. Nothing on a non-root gate. On a root gate, 15 rows and both
  `.expect` lists.
- description: The eval plan's Gaps section says a founder decision is needed before story 1 is
  packeted, because both `.expect` lists assume a non-root runner. Section 10, Open points, does not
  list it, and the blueprint's Open points 2 describes the open matter differently ("how a gap shows in
  a run"). Gate 7 reads the plan's open points first, so this decision would be found late. The same
  pair of texts also leaves one point unsettled. Blueprint Open point 2 calls "how a gap shows in a
  run" "Undecided", while eval plan Open point 3 settles it as "fail with `cannot stage: running as
  root`" and leaves deferral to the founder. Q10 says the plan "records it as a gap"; whether a failing
  row is that gap is not something the user said.
- basis:
  - Eval plan section 8: "The founder should decide which kind of gate the project uses before story 1
    is packeted, since the expect files assume non-root (section 6)."
  - Eval plan section 10 lists five points: pinned versions; shared files, closed; how a gap shows;
    where the converter takes ids; passing rows before the build. None is the choice of gate.
  - TECH-SPEC Open points 2: "Undecided: how a gap shows in a run".
  - Eval plan Open point 3: "this plan makes the ten permission criteria fail with `cannot stage:
    running as root` and leaves deferral to the founder".
  - Q10: "if the test cannot run on the gate's machine, the eval plan records it as a gap."
  - Who decided which part, as the artifacts record it:
    - REQ-08 c1 to c4: the user (Q10). Eval plan section 8 and TECH-SPEC section 4 agree.
    - REQ-07 c1 to c5 and REQ-03 c12: a blueprint recorded default, not accepted by the user in any
      recorded answer. Eval plan section 8 and TD-19 agree with each other.
    - The form of the gap, a failing row: the plan's own choice.

### R62-005: "accepted by the user" is claimed for the root-level `package.json` ban, which the record does not say

- severity: advisory
- resolution: plan-correction
- description: The blueprint says the user accepted, with the layout check, that there is no
  `package.json`, `package-lock.json` or `node_modules` at the repository root. The recorded Q18 item 2
  and D5 speak only of `app/` holding three files and of no builder tests. The root-level refusal is
  therefore a recorded default and should be labelled as one, not as accepted. It is a frozen check
  that fails a repository with a root manifest.
- basis:
  - TD-2: "At the root: recorded default, accepted by the user with the layout check (Q18 item 2, D5)".
  - TECH-SPEC section 13, step 5: "fails the step if any `package.json`, `package-lock.json` or
    `node_modules` exists under `app/` or at the root".
  - Q18 item 2: "strict three-file `app/`, no builder tests committed".
  - D5: "`app/` holds exactly three files; the layout check fails on any other; the builder commits no
    tests under `app/`".
  - Neither mentions the repository root.

### Observations that are not findings

- The accepted limitation D10 (stories 1 and 2 both name `app/shelf.mjs` and `app/src/shelf.mjs`) is
  recorded the same way in the blueprint (section 9) and the eval plan (section 6), and story 2's scope
  file names only those two files. It is not reported.
- The blueprint's recorded defaults that go beyond the PRD (TD-11 unexpected error, TD-7 extra corrupt
  checks, case-sensitive command words) are labelled as defaults and open to the user's change. They are
  not reported.

## 3. Each artifact against its own rubric

### 3.1 PRD (`rubrics/prd.md`), checker's verdict

- Numbering: REQ-01 to REQ-09 each appear once, the sequence has no holes, and every criterion sits
  under one requirement. Counted criteria: 14, 7, 14, 14, 5, 7, 5, 4, 10 = 80. None found outside a
  requirement.

| Requirement | Traced to a user statement | Criteria observable | Role prohibitions present | Input-failure cases present |
|---|---|---|---|---|
| REQ-01 | yes (scope, Q1 to Q4, Q8, Q11 to Q15) | yes | yes, by REQ-05 c3 (the only prohibition) | yes (c9 to c11, c13, c14) |
| REQ-02 | yes | yes | not applicable | not applicable (extra arguments ignored, c7) |
| REQ-03 | yes | yes | not applicable | yes (c4, c5, c6, c7, c13, c14) |
| REQ-04 | yes | yes | not applicable | yes (c4, c5, c6, c7, c12, c13) |
| REQ-05 | yes | yes | yes (c3) | yes (c1, c2) |
| REQ-06 | yes (Q1, Q13) | yes | not applicable | yes (c5 to c7) |
| REQ-07 | yes (scope) | yes | not applicable | the requirement is the failure case |
| REQ-08 | yes (Q10) | yes | not applicable | the requirement is the failure case |
| REQ-09 | yes (scope, Q9) | yes | not applicable | the requirement is the failure case |

- Criteria judged unobservable: none found.
- Undefined terms: none found that a criterion relies on. "Unknown command" is given by REQ-05's flow.
  The file's shape is deliberately the blueprint's decision (Corrupt definition).
- Blockers against this rubric: none found.

### 3.2 Mockup

Not a rubric of its own; checked under review.md item 2.

- Every one of the 80 criteria has a transcript or a stated file state. The Coverage table agrees with
  the PRD's counts.
- The mockup demonstrates no command, option, output line or journey the PRD lacks. The usage
  placeholder names the four words, as D11 allows.
- Header staleness: R62-003.

### 3.3 Blueprint (`rubrics/blueprint.md`), checker's verdict

- A requirement ID originating in the blueprint: none found. Every `REQ-nn` is the PRD's.
- Requirements placed exactly once: all nine. REQ-01 to REQ-05 are in Rules, REQ-06 to REQ-09 in Store.
  Exceptions: none found.
- Criteria with no register row: none found. The register has 80 rows with the PRD's keys.
- Register rows whose evidence is an agent's claim: none found. Every row's evidence is its `rows.txt`
  line, or the gap record for the permission rows.
- Requirements accepting input with no failure behaviour: none found (section 5).
- Shared objects with no concurrency answer: none found (section 8).
- Decisions with no decider: none found (TD-1 to TD-19).
- Concerns of `PRACTICES.md` section A with no line: none found. 26 lines: 8 security, 8 reliability, 4
  observability, 6 delivery.
- Concerns the stack brings beyond section A with no line: none found.
- Conventions of section B with no tool, version or configuration file: none found. The rows for
  Errors, Dependencies, Naming and Comments name ESLint rules and rely on the version and file given in
  the Layering and Formatting rows and in step 2 of the same section.
- Practices of section B neither made concrete nor declined: none found. All 14 rows are present.
- Conventions section lacking a layout tree or size limits: both present.
- Production-readiness defaults below the recommendation without a recorded reason: none found. The
  declines carry D9 and a reason each.
- Blueprint findings from this review: R62-001 (guard), R62-002 (`.gitignore`) and R62-005 (decider
  label). R62-003 (header) also applies.

### 3.4 Eval plan (`rubrics/eval-plan.md`), checker's verdict

- Requirements missing a P or an N test: none found. P and N per requirement are 01: 11/8, 02: 6/2,
  03: 5/9, 04: 5/9, 05: 3/3, 06: 1/6, 07: 4/4, 08: 3/3, 09: 8/8. The counts table agrees with the rows.
- Tests with no or an unknown requirement: none found.
- Criteria absent from both the tests and the gaps: none found. All 80 appear in the section 5 map.
  Section 8 states "No acceptance criterion is without a row."
- Register rows with no test: none found (80 to 80, same keys).
- Criteria whose only evidence is in-process rows: none found. Every row spawns `node app/shelf.mjs` in
  a temporary directory and never imports `app/`.
- Tests with no owner story: none found. Story 1 has 48 rows and story 2 has 50, which is 98.
- Tests with no state-before-the-build value: none found.
- Overlapping story scope: the one overlap is the accepted limitation D10, recorded correctly. Not
  reported as a finding.
- Tests depending on a later story's files: none found. See section 4.7.
- Gaps and untestable sections: both exist. "Untestable as written" says none, and I found nothing
  contradicting that.
- Findings from this review: R62-001, R62-002, R62-003, R62-004.

## 4. Across the artifacts

### 4.1 Id consistency

- Every `REQ-nn` in the blueprint and in the eval plan exists in the PRD. Neither creates an id.
- Every register row has a plan row. The section 5 mapping table matches the register keys exactly: 80
  rows, REQ-04 continued in the second block. I checked each criterion to row pair against its Given,
  When, Then.
- The four restraint rows (T-REQ-01-N6, N7, N8, T-REQ-05-N3) have no register row and are declared so.
- Counts: 46 P, 52 N, 94 integration, 4 restraint, 98 rows, 31 and 29 expected failures. All agree with
  the row tables. The "80 + 11 + 3 + 4" reconciliation is right: the split rows add 11, because 15 rows
  stand for 4 criteria.

### 4.2 Exit codes

PRD, blueprint (TD-10 and the message table), mockup and eval plan agree.

- Exit 2: unknown or missing command, missing or empty title, missing or non-numeric id (including `""`).
- Exit 1: unknown id (including `0`, `007` with no book 7, and any id with no file), and unreadable,
  corrupt or unwritable file.
- Exit 0: success.
- No disagreement found.

### 4.3 Order of checks

PRD section 4, TD-4 and section 2 (rules layer) agree: the command word, then the title or id, then the
file. A numeric id on a corrupt or unreadable file is a file error, exit 1. The plan's rows sample the
rule as the PRD says; the unsampled combinations are named in Gaps. No disagreement found.

### 4.4 Usage-words rule (D11)

- PRD section 6, TD-5, the register (REQ-05 c1, c2, c3, c5 and REQ-06 c7) and eval plan rows T-REQ-05-P1,
  P2, P3, N2, N3 and T-REQ-06-N6 agree.
- REQ-05 c4 and the file-untouched rows correctly do not check the words.
- Other wording remains unchecked. No disagreement found.

### 4.5 Stories, their files and packet files (D10)

- Blueprint section 9 and eval plan section 6 agree.
  - Story 1 creates `app/shelf.mjs`, `app/src/shelf.mjs` and `app/src/store.mjs`.
  - Story 2 edits the first two only and never the store.
  - Scope files are `eval/stories/1.txt` (three files) and `eval/stories/2.txt` (two files).
  - Briefs are `<n>.md`, expectations are `<n>.expect`, and each set ships with its packet.
- The blueprint's layout tree line for `stories/` and the eval plan's packet-file paragraph agree.
- D10 is cited and described the same way in both.
- Not reported: the two rows lists, which I added up. Story 1 is 17 + 7 + 6 + 4 + 4 + 2 + 8 = 48 and
  story 2 is 2 + 1 + 14 + 14 + 3 + 4 + 4 + 8 = 50.

### 4.6 The conventions step, tools, files and guard

- Tools and files agree between TECH-SPEC section 13 and eval plan section 3: npm bundled with Node 22,
  ESLint 9.39.1 with `@eslint/js` 9.39.1, Prettier 3.6.2, `forbidden-in-app.sh` with
  `forbidden-in-app.txt`, `layout-check.sh`, and configs `eslint.config.mjs`, `prettierrc.json`,
  `prettierignore`, `package.json`, `package-lock.json`.
- The guard (absent `app/`, or no `.mjs` file) is present in both, but the two scopes differ: R62-001.
- Git ignoring of `node_modules`: R62-002.
- Versions chosen without a registry, and the registry need: listed in both documents' open points.

### 4.7 Sequencing and ownership

- No story-1 row uses `done` or `drop`. The three rows that need the real commands
  (T-REQ-01-P7, T-REQ-01-P9, T-REQ-02-P3) are owned by story 2, and each asserts exit 0 of the
  `done` or `drop` in its Given. Story-1 forms stage the state those commands leave. This satisfies
  "combined or journey checks come after the stories that supply them".
- Story 2's rows use only story 1's `add` and `list`. No eval needs a file a later story creates.
- Every row has one owner. Each app file has one creating story, and story 2's edit of two files is
  D10.
- The test harness, the converter and the runner are gate-7 deliverables, not a story's, and the plan
  does not claim them for a story. No defect found.

### 4.8 Permission-row gap and who decided which part

Recorded in R62-004. Row counts agree: 10 criteria, 15 rows after the splits (REQ-07: 8, REQ-08: 6,
REQ-03 c12: 1). The root-case arithmetic in eval plan section 6 is right: +6 story-1 rows and +5
story-2 rows, with 4 of story 2's already failing.

### 4.9 Scope beyond the record

None found that is not labelled. The PRD cites only the scope, Q1 to Q15, Q19 and D11, and every
criterion traces. The mockup adds nothing. The eval plan's restraint rows assert the absence of things
the PRD never asks for (extra files, dates or ratings stored, other commands, title text acting as a
command); none adds a capability. The blueprint's extra behaviours are labelled recorded defaults (see
the observations in section 2). R62-005 is a labelling defect, not added scope.

### 4.10 Open points: listed, and none hidden for gate 7

- Listed: pinned versions and the ESLint invocation, the registry need, the permission-row gap, and the
  converter's id source.
- Not listed: the choice of gate (R62-004), plus the plan-level contradictions R62-001 and R62-002,
  which would surface during the freeze.
- Not hidden: the empty-tree proof of the guard is named for gate 7 in the blueprint.

### 4.11 Story 1's `.expect` list against an empty `app/`

State used: `node <path>/app/shelf.mjs` does not exist, so the child exits 1, stderr is non-empty and
stdout is empty, on a non-root runner. I walked all 48 story-1 rows against that.

- Rows that fail: 31. Their Then asserts exit 0 or 2, a stdout line, a `list` output or a created file.
  They are REQ-01: P1, P2, P3, P4, P5, P6, P8, P10, P11, N1 to N8 (17). REQ-02: P1, P2, P4, P5, P6, N1
  (6). REQ-05: P1, P2, P3, N2, N3 (5). REQ-06: P1, N4, N6 (3).
- Rows that pass: 17. Their Then holds under exit 1, empty stdout, non-empty stderr or unchanged disk.
  They are T-REQ-02-N2, T-REQ-05-N1, T-REQ-06-N1, T-REQ-07-P1, P2, N1, N2, T-REQ-08-P1, N1 and
  T-REQ-09-P1, P2, P5, P6, N1, N2, N5, N6.
- The `1.expect` list holds exactly the 31 failing rows, no passing row and no story-2 row. It is right.
- The seventeen passing rows are not `cannot run`, and none depends on a file a later story creates.
- It is right only for a non-root runner (R62-004). The 6 permission rows among the 17 would fail as
  root.
- Story 2's list (29) also checks out against "main with story 1 merged".
  - `done` and `drop` then exit 2 with usage and an untouched file.
  - The 29 failing rows are 3 + 8 + 8 + 2 + 2 + 2 + 4.
  - The 21 passing rows hold under exit 2, an untouched file, or story 1's `list`.

## 5. What I could not judge

- Whether the gate's runner is root. I read only the artifacts, and the blueprint asserts non-root for
  GitHub's hosted runner.
- Whether the pinned versions (ESLint 9.39.1, `@eslint/js` 9.39.1, Prettier 3.6.2) exist. No registry
  was consulted. That is open point 1 in both documents.
- How the `eval/` files that gate 7 will write behave. No test code exists yet.
- Whether Node's missing-module message for the empty tree avoids all four command words in a given
  temporary path. The plan's reasons for the four usage rows rely on it.
- The wording of messages and usage. It is held by the fresh reader, not by any row, by design (Q14,
  D11).
