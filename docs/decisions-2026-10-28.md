# Decisions at gate 6: shelf, 2026-10-28

The user's answers to the gate 6 costed decision list, each numbered, with the user as the
decider. This file is a cited source of scope on the same footing as the confirmed scope
(ORCHESTRATOR.md, gate 6). The artifacts it governs: PRD revision 8, mockup revision 6, blueprint
(TECH-SPEC) revision 9, eval plan revision 5. The earlier decisions D1 to D11 are recorded in
`docs/PREPARATION-STATE.md`; this file adds D12 to D14.

Record of the answer, verbatim (the user, 2026-10-28, 19:39 EDT by the orchestrator's clock):

> 1: Option A. 2: Option A. 3: Yes, I accept gate 6: PRD revision 8, mockup revision 6, blueprint
> revision 9, eval plan revision 5. Write the decisions file and record gate 6 as passed, then stop
> there: do not begin gate 7 in this turn. I will resume you for gate 7 later.

## D12. The gate machine is GitHub's hosted Linux runner, non-root (item 1, Option A)

**Decided by:** the user.

**Finding it closes:** R6-002 (first review), R62-004 (second review), R3-005 (third review): whether
the gate runs as root was not an open point, and the `.expect` lists assume a non-root runner.

**Evidence the orchestrator put before the user:** `.github/workflows/pod-gate.yml` runs its jobs
with `runs-on: ubuntu-latest` (line 15) and the declared runner (line 63), with no `container:`
line; GitHub's hosted runner is a non-root user.

**What it binds:** the fifteen permission rows (T-REQ-07-P1 to P4 and N1 to N4, T-REQ-08-P1 to P3 and
N1 to N3, T-REQ-03-N7) stay in the plan as written; `eval/stories/1.expect` (31 rows) and
`eval/stories/2.expect` (29 rows) stay as the eval plan section 6 lists them. A gate that runs as root
is not planned. If one were ever used, each of those rows fails with the reason
`cannot stage: running as root`, and the founder may defer them through `eval/deferred.txt` with a
defect id (eval plan section 8). The eval plan's Open point 6 cites this file.

## D13. The third review's five text advisories are accepted limitations (item 2, Option A)

**Decided by:** the user.

**Findings it closes,** each verified by the orchestrator against the file, none touching a
requirement, a row, a count or an expectations list:

| Finding | What stays as written | The truth, recorded here |
|---|---|---|
| R3-001 | Eval plan line 5 says revisions after blueprint 4 changed no register row | Blueprint revision 6 reworded the text of five register rows (REQ-05 c1, c2, c3, c5, REQ-06 c7) to carry D11's four-word check; no row was added or removed |
| R3-002 | Blueprint section 13, step 5, credits "the user (D5)" for the layout check failing on any other file under `app/` | D5 is a recorded default the user accepted (Q18 item 2), not the user's own choice |
| R3-003 | PRD section 4, Usage, is tagged `[scope]` | "lists the four commands" came with the orchestrator's Q14 default, which the user accepted; the scope says only "usage" |
| R3-004 | Blueprint section 4 says rows observe titles and ids "never by reading the file's fields" | Restraint row T-REQ-01-N7 reads the stored values of `shelf.json` to assert nothing beyond ids, statuses, titles and the next id is stored, as the eval plan rubric allows a restraint row to do; the blueprint sentence overstates |
| R3-006 | Eval plan Open point 1 does not list the guard proof | Blueprint Open point 1 lists it: gate 7 proves the conventions step's guard by running the suite against the empty tree; the orchestrator carries it to gate 7 from the blueprint |

**What it binds:** no further edit to the four artifacts before the freeze on account of these
five; the state file records them as closed by this decision.

## D14. Gate 6 accepted (item 3)

**Decided by:** the user.

**What it binds:** the plan is accepted at PRD revision 8
(`924e96c26943928659f445118c8afe23acb5f16f27ca01941f473dd9b1ba4e1a`), mockup revision 6
(`6e7abef2da93692c90da5cc3a0198b715de731d6411c1d3e55173ddbe46ff166`), blueprint revision 9
(`eb1d5eb443fc0260c6ab47816a0972bf2e5944e6ad55cbd5872f2a450c5feeab`) and eval plan revision 5
(`c5fa9af302099af69d2edf8c57736adf33f1d08679d29513e1fa34117869056e`), SHA-256 as read by the
orchestrator at 19:29 EDT. Nothing is frozen by this acceptance: the freeze is the user's approval
of the gate 7 pull request. The user directed the orchestrator to stop after recording this and to
begin gate 7 in a later session.

## Reviews behind this acceptance

| Review | Session | Result |
|---|---|---|
| `docs/reviews/gate-6-plan-review.md` | fresh prep-checker, 19:18 EDT | 0 blockers, 6 advisories; 5 corrected in the one allowed pass, R6-002 to the user (D12) |
| `docs/reviews/gate-6-plan-review-2.md` | fresh prep-checker, 19:28 EDT | 2 blockers, both plan-correction, corrected in the one allowed pass; 3 advisories |
| `docs/reviews/gate-6-plan-review-3.md` | fresh prep-checker, 19:37 EDT | 0 blockers, 6 advisories: R3-005 is D12, the rest are D13 |
