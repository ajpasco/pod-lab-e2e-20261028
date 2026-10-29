# Gate 3 findings 2: PRD revision 3 and mockup revision 2 (shelf)

Reviewed: `docs/PRD.md` (revision 3), `docs/MOCKUP.md` (revision 2, terminal transcripts), against
`docs/orchestrator/rubrics/prd.md`, ORCHESTRATOR.md "Gate 3", and the PREPARATION-STATE record of
the user's words (Gate 1 idea, Q1 to Q15). No earlier findings file was read.

Verdict: no blockers. Five advisories.

## Checker's verdict

### Numbering check

- Each `REQ-nn` heads exactly one section: REQ-01 to REQ-09, each once, in order, no holes, one width
  (two digits) throughout. Pass.
- Every acceptance criterion sits under exactly one requirement; no criterion sits outside a
  requirement. Pass.
- Criteria per requirement:

| Requirement | Criteria |
|---|---|
| REQ-01 | 13 |
| REQ-02 | 7 |
| REQ-03 | 12 |
| REQ-04 | 11 |
| REQ-05 | 5 |
| REQ-06 | 4 |
| REQ-07 | 5 |
| REQ-08 | 4 |
| REQ-09 | 10 |
| Total | 71 |

The total of 71 matches the mockup's coverage section.

### Per-requirement table

| Requirement | Traced to a user statement | Criteria all observable | Role prohibitions present | Input-failure cases present |
|---|---|---|---|---|
| REQ-01 Add a book | yes (scope, Q1, Q2, Q4, Q8, Q11, Q12, Q13, Q15) | yes | not applicable (single role; prohibitions are in REQ-05 criterion 3) | yes (missing, empty, whitespace-only title) |
| REQ-02 List the books | yes (scope, Q1, Q7) | yes | not applicable | not applicable for arguments (extra arguments covered by criterion 7); file failures are REQ-07 and REQ-09 |
| REQ-03 Mark a book read | yes (scope, Q3, Q5, Q7, Q11, Q13, Q15) | yes | not applicable | yes (missing, non-numeric, unknown) |
| REQ-04 Drop a book | yes (scope, Q2, Q5, Q7, Q11, Q13, Q15) | yes | not applicable | yes (missing, non-numeric, unknown) |
| REQ-05 Refuse an unknown command | yes (scope, Q6, Q11, Q13, Q15) | yes | yes (`shelf search` and `shelf rate` refused, criterion 3; section 3) | yes (unknown word, bare `shelf`) |
| REQ-06 Missing shelf file | yes (Q1, Q11, Q13) | yes | not applicable | yes |
| REQ-07 Unreadable shelf file | yes (scope, Q11) | yes | not applicable | yes |
| REQ-08 Unwritable shelf file | yes (Q10, a recorded default, Q11) | yes | not applicable | yes |
| REQ-09 Corrupt shelf file | yes (scope, Q9, Q11, Q15) | yes | not applicable | yes (invalid JSON, wrong shape) |

### Criteria judged unobservable

None found. Every criterion names an output line, an exit code, a stream, or a file state
(untouched, absent, created) that someone other than the author can check. No undefined term
blocks a criterion: Usage, Untouched, Failed command, Order of checks, and each file state are
defined in section 4.

## Findings

### Numbering, traceability, observability, undefined terms

none found.

### Rubric findings on the PRD

**F2-01. advisory, plan-correction.** REQ-01 criterion 1 says "On an empty shelf" while the
definition of Id and criterion 7 say an emptied shelf does not restart at 1.
- Basis: REQ-01 criterion 1, "On an empty shelf, `shelf add Dune` prints exactly `added 1 Dune`".
  Section 4, Id: "The first book added to an empty, never-used shelf gets id 1". Criterion 7: "after
  every book is dropped, the next add gets an id higher than any id used before."
- An emptied shelf is an empty shelf, so criterion 1 read alone contradicts criterion 7. Criterion 1
  needs the "never-used" qualifier its definition already carries.

**F2-02. advisory, plan-correction.** Section 4 claims behaviours that no criterion backs and no
transcript shows.
- Basis, first: Unknown id definition, "or `007` when there is no book 7". REQ-03 criterion 8 and
  REQ-04 criterion 8 cover `007` only "when book 7 exists"; criteria 7 cover only `0`. There is no
  criterion for `007` with no book 7 (expected exit 1).
- Basis, second: Numeric id definition, "`1.5`, `-1`, `1a`, `+1` and the empty string are
  non-numeric". Criteria 5 of REQ-03 and REQ-04 list `abc`, `1.5`, `-1`, `1a`, `+1` and omit the
  empty string (`shelf done ""`).
- Rubric rule: "Each criterion covers one case. Where behaviour differs by ... state, there is a
  criterion per ... state."

**F2-03. advisory, plan-correction.** The Order of checks definition is broader than the criteria
that back it.
- Basis: section 4, "An argument error ... therefore takes precedence over a file error ..., whatever
  the file holds." Criteria exist only for `add ""` with a corrupt file (REQ-01 13), `done abc` with
  a corrupt file (REQ-03 11), `done` with an unreadable file (REQ-03 12), `drop abc` with a corrupt
  file (REQ-04 11) and `frobnicate` with a corrupt file (REQ-05 5). There is none for `add` or `drop`
  with an unreadable file, for a missing title or a whitespace-only title with a bad file, or for an
  unknown command with an unreadable file.
- The sampled cases are consistent with the rule. Each case the definition claims is a distinct
  state.

**F2-04. advisory, plan-correction.** Q13 ("every failed command leaves the disk as it was") has no
criterion for an argument error when `shelf.json` is absent.
- Basis: Failed command definition, "a failed command never creates or changes it". The only "no
  file created" criteria are REQ-06 criteria 2, 3 and 4 (list, done 1, drop 1). REQ-01 criteria 9 to
  11 say "adds no book" but not that no file appears; REQ-05 criterion 4 and REQ-01 13 say
  "untouched", and the definition of Untouched ("byte-for-byte what it was before") does not state
  the absent-file case.
- Absence stated: there is no criterion that `shelf add ""`, `shelf done abc` or `shelf frobnicate`
  in a directory with no `shelf.json` leaves it absent.

### Mockup against PRD

Direction 1, criteria with no transcript: none. Every one of the 71 criteria appears in at least
one transcript. Criteria shown only by a stated file state ("untouched", "still absent", "nothing
changed on disk") are REQ-01 8 and 13 (file part), REQ-02 5, REQ-03 10 and REQ-04 10 (file part;
the follow-up `shelf list` does show the books), REQ-05 4, REQ-06 2, 3 and 4 (file part), REQ-07 5,
REQ-08 4, REQ-09 9 and 10. The mockup declares this itself, and for a command-line tool whose file
contents are deliberately not shown it is acceptable.

Direction 2, transcript behaviour with no criterion: none. Every command, output line and exit code
in the transcripts is backed by a criterion. The mockup adds no command or option.

Claims the PRD makes that the mockup cannot show, only because the PRD gave no criterion: see F2-02
and F2-03 (these are PRD gaps, not mockup gaps).

**F2-05. advisory, plan-correction.** The mockup's transcripts for REQ-03 criterion 8 and REQ-04
criterion 8 print a literal `...` line inside a stdout block, against the mockup's own legend.
- Basis: Legend, "A plain line is a line on stdout, exactly as printed." REQ-03 criterion 8
  transcript: `$ shelf list` followed by `...` then `7 read Ulysses`; REQ-04 criterion 8 transcript:
  `$ shelf list` followed by `...` then `exit 0`. `...` is not defined in the Legend; it is
  explained only in a line after each block.
- Repair is in the mockup, no behaviour changes.

## Gate 3 mockup rules

- Mockup demonstrates every journey the PRD claims: yes, with the caveats above.
- Mockup claims no journey the PRD lacks: yes.
- Every requirement traces to the user's words: yes.
- Every criterion observable: yes.
- Mockup change altering behaviour with no PRD change: none found. The mockup states it is of
  PRD revision 3 and matches that revision's criteria.

## Summary of findings

| Id | Severity | Resolution class |
|---|---|---|
| F2-01 | advisory | plan-correction |
| F2-02 | advisory | plan-correction |
| F2-03 | advisory | plan-correction |
| F2-04 | advisory | plan-correction |
| F2-05 | advisory | plan-correction |

Blockers: none.
