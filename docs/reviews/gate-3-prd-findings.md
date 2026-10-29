# Gate 3 findings: PRD revision 2 and mockup

Reviewed: `docs/PRD.md` (revision 2) and `docs/MOCKUP.md`, against `docs/orchestrator/rubrics/prd.md`
and the Gate 3 rules in `docs/orchestrator/ORCHESTRATOR.md`. The record of what the user said is
`docs/PREPARATION-STATE.md`, Gate 1 and Q1 to Q14 only.

Verdict: no blockers. Four advisories (F-01 to F-04).

## Checker's verdict (PRD rubric)

### Numbering check

- Every `REQ-nn` from REQ-01 to REQ-09 appears exactly once as a section heading in section 5.
  REQ-nn mentions elsewhere are citations, not headings.
- The sequence has no holes. A single width (`REQ-nn`) is used throughout.
- Every acceptance criterion sits under exactly one requirement. REQ-01 has 12, REQ-02 has 7, REQ-03
  has 10, REQ-04 has 10, REQ-05 has 4, REQ-06 has 4, REQ-07 has 5, REQ-08 has 4 and REQ-09 has 10. No
  criterion sits outside a requirement.
- The sentence under REQ-06's Flow ("`shelf add` on a missing shelf file is covered by REQ-01
  criterion 8") is a note, not a criterion.
- Result: pass. No numbering blocker.

### Per-requirement table

| Requirement | Traced to a user statement | All criteria observable | Role prohibitions present | Input-failure cases present |
|---|---|---|---|---|
| REQ-01 Add a book | yes (scope, Q1, Q2, Q4, Q8, Q11, Q12, Q13) | yes | not applicable at requirement level; role-level prohibitions in F-01 | yes (missing, empty, whitespace-only title) |
| REQ-02 List the books | yes (scope, Q1, Q7) | yes | not applicable at requirement level (F-01) | not applicable (no input beyond ignored extras, Q7) |
| REQ-03 Mark a book read | yes (scope, Q3, Q5, Q7, Q11, Q13) | yes | not applicable at requirement level (F-01) | yes (missing, non-numeric, unknown id) |
| REQ-04 Drop a book | yes (scope, Q2, Q5, Q7, Q11, Q13) | yes | not applicable at requirement level (F-01) | yes (missing, non-numeric, unknown id) |
| REQ-05 Refuse an unknown command | yes (scope, Q6, Q11, Q13) | yes | partial: `search` and `rate` are criteria, "date", "web app or server" are not (F-01) | yes (unknown word, bare `shelf`) |
| REQ-06 Missing shelf file is an empty shelf | yes (Q1, Q11, Q13) | yes | not applicable (F-01) | not applicable |
| REQ-07 Refuse an unreadable shelf file | yes (scope, Q11) | yes | not applicable (F-01) | not applicable |
| REQ-08 Refuse when the file cannot be written | yes (Q10, Q11) | yes | not applicable (F-01) | not applicable |
| REQ-09 Refuse a corrupt shelf file | yes (scope, Q9, Q11) | yes | not applicable (F-01) | yes (not valid JSON; wrong shape) |

Undefined terms: none found. "Untouched", "Failed command", "Usage", "Numeric id", "Missing id",
"Unknown id", "Missing/Unreadable/Corrupt/Unwritable shelf file" and "Empty title" are all defined in
section 4.

### Criteria judged unobservable

None found.

Two wordings were considered and kept. REQ-01 criterion 12, "stores the title `Dune`", is observable
because the same criterion requires `added <id> Dune`, and the mockup shows it through `shelf list`.
The exit codes (1 and 2) and the file name `shelf.json` are in the user's own Gate 1 text, and for a
command-line tool they are what a person sees. They are not technical choices the drafter made.

## Findings

### F-01 (advisory, plan-correction): role prohibitions "date" and "web app or server" are not criteria

Description: the rubric says "Every role's prohibitions are stated as acceptance criteria, not implied
by the absence of a permission." Section 3 lists the reader's prohibitions as "search, rate or date
books; use shelf as a web app or a server" and says "These are refused as unknown commands (REQ-05)".
REQ-05 criterion 3 covers only `search` and `rate`. Nothing covers dates, and nothing covers
web-app or server use. The sentence that all of these are "refused as unknown commands" is also not
true of the last two, which are not commands.

Basis: PRD section 3, "May not: search, rate or date books; use shelf as a web app or a server. These
are refused as unknown commands (REQ-05)." REQ-05 criterion 3: "`shelf search x` and `shelf rate 1 5`
are unknown commands". Absence: no criterion mentions dates or a server.

Resolution class: plan-correction (either state a criterion for each prohibition that can be observed,
or narrow section 3 to what REQ-05 covers).

### F-02 (advisory, plan-correction): the mockup shows `done 7 Ulysses` and `dropped 7 Ulysses` for input `007`, and no criterion fixes that output

Description: the PRD criteria for `007` say only that book 7 is marked read or dropped. The mockup
transcripts show the printed id as `7`, not `007`. That is transcript behaviour with no criterion.
The Gate 1 text says only `done <id> <title>`, and Q5 says `007` denotes id 7, so the user's words
support `7` but the PRD does not state it.

Basis: MOCKUP REQ-03 criterion 8, "`$ shelf done 007` / `done 7 Ulysses`", and REQ-04 criterion 8,
"`$ shelf drop 007` / `dropped 7 Ulysses`". PRD REQ-03 criterion 8: "`shelf done 007` marks book 7
read when book 7 exists." PRD REQ-04 criterion 8: "`shelf drop 007` drops book 7 when book 7
exists." Neither states the printed line.

Resolution class: plan-correction (add the printed line to the two PRD criteria, or remove it from
the mockup; both follow Q5).

### F-03 (advisory, user-decision): precedence between argument errors and file errors is unspecified

Description: the PRD defines argument errors (exit 2) and file errors (exit 1) separately. It does not
say what happens when both apply, for example `shelf done abc` or `shelf add ""` while `shelf.json` is
corrupt or unreadable, or an unknown command while the file is corrupt. Each of exit 1 and exit 2 would
satisfy the criteria as written, so a tester cannot say which is right. This names a gap and proposes
no scope. The user's Gate 1 text does not settle it.

Basis: absence. No criterion in REQ-01, REQ-03, REQ-04, REQ-05, REQ-07 or REQ-09 states the combined
case. For example REQ-09 criterion 3 is only "`shelf done 1` exits 1", with a valid id.

Resolution class: user-decision.

### F-04 (advisory, plan-correction): the mockup's coverage statement overclaims

Description: the Coverage section says "Every criterion of REQ-01 to REQ-09 appears in at least one
transcript. None could not be shown as a transcript." Several criteria are shown only as a prose
sentence about file state, not as a command and its output. The coverage table admits this for REQ-07
criterion 5, REQ-08 criterion 4 and REQ-09 criteria 9 and 10. The same is true of REQ-02 criterion 5
("`shelf.json` untouched.") and REQ-05 criterion 4. The statement and the table contradict each other.
This is a defect in wording only: the legend defines "untouched" as an allowed way to state file
state, and no criterion is left with no mention at all. Criteria demonstrated only by an asserted
state are not demonstrated by a transcript.

Basis: MOCKUP Coverage, "None could not be shown as a transcript", against the REQ-07 row, "Criterion 5
is shown as the stated state of the file, "untouched", not as a command."

Resolution class: plan-correction.

## Mockup against PRD, both directions

### PRD criteria with no transcript

None found. Every criterion of REQ-01 to REQ-09 has at least a transcript or a stated-state line
(see F-04 for those shown as stated state only). I checked each against its transcript. Examples:
REQ-01 criteria 1 to 12, REQ-02 criteria 1 to 7, the five non-numeric ids in REQ-03 and REQ-04, and
the four wrong-shape setups (a) to (d) in REQ-09, which match the PRD's list (an array, a number, an
object missing its books or its next id).

### Transcript behaviour with no criterion

One item: the printed id `7` for input `007` (F-02). Otherwise none found. The mockup claims no
command, option or output line that the PRD lacks. The additional list steps in the transcripts
(for example `shelf list` after a failed add) are observation of the criterion's stated outcome, not
new behaviour.

### Journeys

The mockup demonstrates the journeys of REQ-01 to REQ-09 and claims no journey the PRD lacks.

## Traceability to the user's words

Every requirement and criterion traces to Gate 1 or Q1 to Q14. Specific points checked:

- Q11 ("nothing on stdout for any error") carries the stdout-empty clause in every error criterion.
- Q13 supports the "Failed command" definition and REQ-06 criteria 3 and 4.
- Q12 supports REQ-01 criterion 12 and the Title definition.
- Q5, Q9, Q10 and Q14 are marked as accepted defaults in the PRD header, matching the state file's
  Kind column.
- REQ-05 criterion 3 (`search x`, `rate 1 5` refused) is derived from "no search, no ratings" and
  "an unknown command exits 2 with usage". This is a derivation, not an addition.
- The non-goal "ship more than two stories" is the user's "Two stories at most".

Traceability findings: none found.

## Section 8 and the change log

Open questions: none found. The PRD says none is open, and the state file's open-questions table is
empty. The change log quotes the user's words for Q11 to Q14, matching the state file.
