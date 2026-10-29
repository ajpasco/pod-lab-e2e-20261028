# Gate 3 findings, third check: PRD revision 4 and mockup revision 3

Reviewed: `docs/PRD.md` (revision 4), `docs/MOCKUP.md` (revision 3, terminal transcripts).
Standard: `docs/orchestrator/rubrics/prd.md` (Checker's verdict), `docs/orchestrator/ORCHESTRATOR.md`
section "Gate 3", and the user's words in `docs/PREPARATION-STATE.md` (Gate 1 idea; Q1 to Q15).
No earlier findings file was read.

Verdict: no blockers. Three advisories.

## 1. Numbering check

- Every `REQ-nn` appears exactly once as a section heading: REQ-01 to REQ-09. No hole, no duplicate,
  one width (`REQ-nn`) throughout.
- Every acceptance criterion sits under exactly one requirement; none sits outside the requirements.
  The Flow steps are numbered separately from the Acceptance lists.
- Criteria per requirement:

| Requirement | Criteria |
|---|---|
| REQ-01 | 14 |
| REQ-02 | 7 |
| REQ-03 | 14 |
| REQ-04 | 14 |
| REQ-05 | 5 |
| REQ-06 | 7 |
| REQ-07 | 5 |
| REQ-08 | 4 |
| REQ-09 | 10 |
| Total | 80 |

The total of 80 matches the mockup's own count. Result: clean.

## 2. Per-requirement table

| Requirement | Traced to a user statement | Criteria all observable | Role prohibitions present | Input-failure cases present |
|---|---|---|---|---|
| REQ-01 Add a book | yes (scope, Q1, Q2, Q4, Q8, Q11, Q12, Q13, Q15) | yes | yes, by REQ-05 criterion 3 (the one role's prohibitions: search, rate) | yes (missing, empty, whitespace-only title; argument error with corrupt file) |
| REQ-02 List the books | yes (scope, Q1, Q7) | yes | yes, by REQ-05 criterion 3 | not applicable (no required input; extra arguments, criterion 7) |
| REQ-03 Mark a book read | yes (scope, Q3, Q5, Q7, Q11, Q13, Q15) | yes | yes, by REQ-05 criterion 3 | yes (missing, non-numeric, empty-string, unknown, `0`, `007`) |
| REQ-04 Drop a book | yes (scope, Q2, Q5, Q7, Q11, Q13, Q15) | yes | yes, by REQ-05 criterion 3 | yes (same set as REQ-03) |
| REQ-05 Refuse an unknown command | yes (scope, Q6, Q11, Q13, Q15) | yes | yes (criterion 3: `shelf search`, `shelf rate`) | yes (unknown word, bare `shelf`) |
| REQ-06 Missing shelf file as empty shelf | yes (Q1, Q13) | yes | yes, by REQ-05 criterion 3 | yes (criteria 5 to 7) |
| REQ-07 Refuse an unreadable shelf file | yes (scope, Q11) | yes | yes, by REQ-05 criterion 3 | not applicable (the input is the file; all four commands covered) |
| REQ-08 Refuse when the shelf file cannot be written | yes (Q10, Q11) | yes | yes, by REQ-05 criterion 3 | not applicable (all three writing commands covered) |
| REQ-09 Refuse a corrupt shelf file | yes (scope, Q9, Q11, Q15) | yes | yes, by REQ-05 criterion 3 | yes (not valid JSON; wrong shape; all four commands) |

## 3. Criteria judged unobservable

None found. Every criterion names an exit code, a stdout or stderr line, or a before and after file
state that a person other than the author can check. Terms the criteria rely on (never-used shelf,
numeric id, empty title, unreadable, unwritable, corrupt, untouched, failed command, usage, order of
checks) are defined in section 4. No undefined term found.

## 4. Mockup against the PRD, both directions

- Criteria with no transcript: none found. All 80 criteria appear in a transcript. Seven groups are
  shown as a stated file state beside a transcript (REQ-02 c5, REQ-05 c4, REQ-07 c5, REQ-08 c4,
  REQ-09 c9 and c10, and the file-state part of others). The mockup says so openly, and the file's
  contents are not shown by design.
- Transcript behaviour with no criterion: none found. Every later `shelf list` after a setup is
  covered by REQ-02 c1 or c3 and the criterion it follows. The mockup's added setup detail in REQ-08
  ("still readable") narrows a case; it adds no command, output line or behaviour.
- Journeys the mockup claims that the PRD lacks: none found. Journeys the PRD claims that the mockup
  lacks: none found.

## 5. Findings

### F3-01
- Severity: advisory
- Resolution class: plan-correction
- Description: Q11 says every error prints nothing on stdout, and Q1 (Gate 1) says argument errors
  carry a message on stderr. Four precedence criteria fix only the exit code, so the user's "any
  error" is not stated for these cases. The Order of checks definition states exit codes only, so
  these are not samples of a stated rule on stdout or stderr. The mockup repeats the gap on purpose
  ("This criterion fixes only the exit code").
- Basis: PRD REQ-03 criterion 11 "`shelf done abc` while `shelf.json` is corrupt exits 2."; REQ-03
  criterion 12 "`shelf done` (missing id) while `shelf.json` is unreadable exits 2."; REQ-04 criterion
  11 "`shelf drop abc` while `shelf.json` is corrupt exits 2."; REQ-05 criterion 5 "exits 2 and prints
  usage on stderr" (no stdout statement). Q11: "Yes, nothing on stdout for any error." Compare
  REQ-01 criteria 13 and 14 and REQ-04 criterion 14, which do state it.

### F3-02
- Severity: advisory
- Resolution class: plan-correction
- Description: Section 3 tags "There is no other role, no sign-in and no sharing." as `[scope]`.
  "No sign-in" and "no sharing" are not in the user's idea; the idea says "one person on their own
  machine". No criterion backs them. They are not a requirement claim, but the source tag is
  inaccurate.
- Basis: PRD section 3, last bullet, "There is no other role, no sign-in and no sharing. [scope]".
  Gate 1 text contains no "sign-in" or "sharing".

### F3-03
- Severity: advisory
- Resolution class: plan-correction
- Description: REQ-09 criteria 5 to 8 and 10 describe the wrong-shape file by its internal fields
  ("books", "next id"). The rubric says a criterion says what a person would see, and file shape is
  the blueprint's. The mockup legend also says "its shape is the blueprint's decision" while setups
  (c) and (d) rely on the PRD naming those fields. The wording comes from the user's accepted default
  (Q9), so this is the user's decision recorded in a criterion and not an invention.
- Basis: PRD REQ-09 criterion 5 "Valid JSON of the wrong shape (an array, a number, or an object
  missing its books or its next id)"; rubric: "No ... table or column shape ... file name"; mockup
  Legend: "its shape is the blueprint's decision".

## 6. Items checked and found clean

- Every requirement traces to the scope or to Q1 to Q15; REQ-06 cites Q1 and REQ-08 cites Q10 (an
  accepted default, recorded as such in the PRD preamble).
- Q5 cases (`1.5`, `-1`, `1a`, `+1`, empty string, `0`, `007` with and without book 7) have criteria
  under REQ-03 and REQ-04. Q7 (extra arguments) has criteria for `list`, `done`, `drop`. Q2, Q3,
  Q4, Q6, Q8, Q9 (both the not-valid-JSON and wrong-shape forms, all four commands), Q10, Q12,
  Q13 and Q15 each have criteria.
- REQ-01 criterion 1 ("never-used shelf") agrees with criterion 7 and the Id definition.
- Open questions: "No question is open" agrees with the recorded answers (none deferred).
- The change log quotes the user's words for Q11 to Q15 and states that revision 4 needed no answer.
