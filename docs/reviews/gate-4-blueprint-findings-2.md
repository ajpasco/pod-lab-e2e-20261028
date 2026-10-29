# Gate 4 findings, second check: technical blueprint, shelf

Artifact: `docs/TECH-SPEC.md`, revision 2. Rubric: `docs/orchestrator/rubrics/blueprint.md`
("Checker's verdict"). Inputs read: the PRD (revision 5), `PRACTICES.md`, `RUNTIMES.md` (the
section "What the gate needs from any runner"), and the Q1 to Q18 and D1 to D9 tables of
`PREPARATION-STATE.md`. No earlier findings file was read.

Verdict in one line: 1 blocker (B-01), 7 advisories. The register is complete and exact at 80/80.

## 1. Does any requirement ID originate in the blueprint?

None found. Every `REQ-nn` in the blueprint is REQ-01 to REQ-09, the ids the PRD gave. The ids it does
coin are `TD-n` (decisions) and `T-REQ-nn-…` (row ids). The `T-REQ-nn-…` row ids reuse the PRD's
numbers and are assigned at gate 5. Neither kind is a requirement.

## 2. Requirements placed exactly once

None found. Section 3 puts REQ-01 to REQ-05 under Rules and REQ-06 to REQ-09 under Store. Each of the
nine appears once. The boundary is stated to own none.

## 3. Criteria with no register row

None found. I counted the PRD's criteria per requirement and the register's rows per requirement:

| Requirement | PRD criteria | Register rows |
|---|---|---|
| REQ-01 | 14 | 14 |
| REQ-02 | 7 | 7 |
| REQ-03 | 14 | 14 |
| REQ-04 | 14 | 14 |
| REQ-05 | 5 | 5 |
| REQ-06 | 7 | 7 |
| REQ-07 | 5 | 5 |
| REQ-08 | 4 | 4 |
| REQ-09 | 10 | 10 |
| Total | 80 | 80 |

Each criterion has exactly one row, and no row cites a criterion the PRD lacks. I spot-checked the
rows against the criteria for the combined cases (REQ-03 c12, REQ-04 c14, REQ-05 c5, REQ-01 c13 and
c14, REQ-08 c4, REQ-07 c5). The rows follow the PRD.

## 4. Register rows whose evidence is an agent's claim

None found. Every row's evidence is "its `rows.txt` line", a `pass` or `fail` line that
`eval/run.sh` writes from `node --test` TAP output. That matches the report format in RUNTIMES.md.
No row uses a human-review mechanism, so the two-step rule does not apply.

For the 10 `[non-root]` rows (REQ-07 c1 to c5, REQ-08 c1 to c4, REQ-03 c12), the evidence on a root
gate is "the gap recorded at gate 5". It is not a test result. This is an open point the blueprint
itself raises, and I report it as A-06. It is not an agent claim.

## 5. Requirements accepting input with no failure behaviour

None found. Section 5 covers REQ-01 to REQ-09. Each has its validation, its missing and malformed
behaviour (or "Not applicable" with a reason), and what is never logged. The full message and exit-code
table is in section 10.

## 6. Shared objects with no concurrency answer

None found. The one shared object, `shelf.json`, is answered in section 8: no lock, last write wins,
the rename keeps each write whole, and the decider is "recorded default" with the cost stated. This
matches the record. Q18 item 6 / D9 accepted "no file lock".

## 7. Decisions with no decider

None found. TD-1 to TD-19 each name a decider, and I checked each against the record:

- TD-4: Q15/D1. TD-8: Q18 item 1/D4. TD-6 "other fields": Q18 item 5/D8. TD-15 "the reader's
  invocation": Q18 item 4/D7. TD-19 "REQ-08": Q10.
- TD-3's "layout check's content: accepted by the user, Q18 item 2, D5".
- The "recorded default, accepted by the user (Q18 item n, Dk)" wording is used correctly where the
  record shows a default accepted (items 1, 2 and 6), and "the user" where the record shows a chosen
  option (items 3, 4 and 5).

Two deciders are inconsistent or blurred. They are findings, not missing deciders (A-01, A-03).

## 8. Section A concerns with no line in the production-readiness review

None found. Section 12 has 26 lines: 8 Security, 8 Reliability, 4 Observability and 6 Delivery and
data. That is one for each concern in `PRACTICES.md` section A. Each is in scope with a decision, or
excluded with a decider and a "brought back by". There is no blanket paragraph.

## 9. Concerns the stack brings beyond section A with no line

None found. Seven are listed and answered: crash and disk-full safety, file mode on creation,
exit-code contract, platform support, control characters in a title, stdout write failure, and
`shelf` on the path. I did not find an unlisted stack concern.

## 10. Section B conventions with no tool, version or configuration file named

**B-01 (blocker, blueprint-change). The Commits convention names no configuration file.**
- Basis: the Commits row says "Tool: `git`, the version on the builder's machine; none is pinned
  because no check runs on it. Configuration: none under `eval/`."
- The review brief accepts `git`, `sh` and `grep` as unpinned system tools when "unpinned, system" is
  stated and a file under `eval/` is named. The row states the tool as unpinned, but it names no file
  and says outright that there is none. The rubric says a convention that names no tool and no file is
  a wish, and the rule is held by prose only. By the rubric's own test the row fails.
- The change log claims the checker's B-01 was fixed with "named files for the commit, layout and
  forbidden-in-app checks". The layout and forbidden-in-app checks are fixed; the commit check is not.
- Resolution: name a file under `eval/` that holds it, or make the practice "declined" with one
  sentence saying why it does not apply to this stack. The blueprint must pick one. I propose neither
  as new scope.

Accepted as concrete:
- Forbidden-in-app check: `grep` and POSIX `sh`, stated as "unpinned system tools", with
  `eval/conventions/forbidden-in-app.sh` and `forbidden-in-app.txt` named. I accept this.
- Layout check: `sh`, stated as unpinned, with `eval/conventions/layout-check.sh` named. I accept
  this.
- The Errors, Naming and Comments rows name ESLint rules without repeating the version or the file in
  the row. ESLint 9.39.1 and `eval/conventions/eslint.config.mjs` are named in the Layering and
  Formatting rows and in the conventions step. I accept this by reference.

## 11. Section B practices neither made concrete nor declined with a reason

None found beyond B-01. All 14 rows (Layering, Layout, Limits, Errors, Logging, Configuration,
Dependencies, Types, Formatting and lint, the builder's own tests, Naming, Comments, Commits, The
client) are made concrete or declined in a sentence with a decider. The Logging, Configuration, Types
and builder-tests declines carry D9 or D5.

## 12. Conventions: layout tree and size limits

Both present. The tree has one line per folder (`app/`, `app/src/`, `docs/`, `eval/`,
`eval/conventions/`, `eval/report/`, `eval/stories/`), each saying what belongs there and what does not.
The limits table gives 300 lines, 50 lines and complexity 10, with the ESLint rules `max-lines`,
`max-lines-per-function` and `complexity`. Nothing to report.

## 13. Findings: production-readiness defaults below the recommendation

Most departures from the recommendation carry a recorded reason and were accepted by the user in
Q18 item 6 / D9 (no file lock, no configuration loading, no logs, no README, no type checker, no
secret scan). Those need no finding. Two lack a sound recorded reason:

**A-04 (advisory, blueprint-change). Input validation sits in the rules layer, while section 12 says
"at the boundary".**
- PRACTICES.md recommends validation at the boundary.
- The boundary table (section 2) says the boundary never "checks anything about a title or id"; the
  rules own "the order of checks". Section 12 says "arguments are validated at the boundary's call
  into the rules before the file is opened (D1)".
- The two statements disagree, and the departure from the recommendation is not named as one.

**A-07 (advisory, user-decision). The dependency-audit decline reason does not cover the one
dependency tree that exists.**
- Basis: "The audit of known vulnerabilities is declined: with no dependencies there is nothing to
  audit (recorded default, accepted by the user, Q18 item 6, D9)".
- `eval/conventions/` carries a pinned ESLint and Prettier tree and its own lockfile (D3). That is a
  dependency tree an audit could read. The reason "no dependencies" holds for `app/` only.
- D9 records "no dependency audit" as accepted. The orchestrator may wish to confirm that the user's
  acceptance covered the tools' lockfile.

## 14. Other findings

**A-01 (advisory, blueprint-change). TD-2 credits the user for an item that section 12 calls a
recorded default.**
- TD-2: "no `package.json` under `app/` and none at the root; … | the user (Q16, D2)".
- Section 12, Dependencies: "That `app/` has no `package.json` or lockfile, and that the conventions
  step refuses a `package.json` under `app/` or at the root … are recorded defaults (the user chose
  the layout and the tools, D2, D3, not these rules)".
- The record (Q16, D2) says "no `package.json`" for the layout. It does not record a refusal at the
  root or a `node_modules` refusal. The two blueprint passages disagree on whose decision it is.

**A-02 (advisory, blueprint-change). Two section 13 rows present as D2 or D3 what TD-3 itself calls
recorded defaults.**
- The Layering row ends "(D2)". It contains `no-restricted-globals` and the per-file import rules.
- The Formatting row ends "(D3)". It contains `singleQuote: true`, `printWidth: 100` and the
  disabled inline directives.
- TD-3 lists `singleQuote`, `printWidth`, `no-restricted-imports`, `no-restricted-globals` and
  `noInlineConfig` as "recorded defaults". D2 fixes only the three files and the one-way direction;
  D3 fixes only the pinned tools and the limits.

**A-03 (advisory, blueprint-change). A decider is written as two.**
- Section 12, "Exit-code contract": "PRD clause and user (D1)".
- The rubric says a decision that cites a clause and records a question to the user is rejected: "one
  or the other". TD-10 cites the PRD clause alone, so the two places disagree. The PRD already carries
  Q15 inside its Order of checks clause.

**A-05 (advisory, plan-correction). `npm ci` is a tool of the conventions step with no version and no
"unpinned, system" statement, and gate network access is not stated.**
- Basis: step 1, "Install: `npm ci --prefix eval/conventions` (the only install; `app/` gets none)".
- `npm` is not stated as unpinned or system (it ships with Node 22).
- `eval/runtime` is "the single line `node 22`", so the step also depends on the gate machine reaching
  a package registry. Open point 1 touches the registry only for generating the lockfile. This is
  stated nowhere as an assumption or as an open point.

**A-06 (advisory, plan-correction). The evidence of ten rows is undecided if the gate runs as root.**
- Basis: Open point 2, "Undecided: how a gap shows in a run, since `rows.txt` and `eval/deferred.txt`
  (which needs a defect id from the founder) have no entry for 'cannot run'."
- RUNTIMES.md treats "a row that is skipped" as a failure, and a deferral needs a `D-k`. A root gate
  would therefore fail the run, not record a gap. The blueprint raises this honestly as an open point
  and carries it to gate 5. Q10 directs the gap record for REQ-08. I do not call it a blocker, because
  the rows run as written for a non-root runner. The orchestrator should not let gate 5 pass without
  settling it.

**A-08 (advisory, plan-correction). Open point 7 is not open.**
- Basis: "7. **Complexity limit 10 and the exact 300 / 50 limits** are recorded defaults".
- TD-18 and the Limits table already decide these as recorded defaults. Listing them under "what
  remains undecided" contradicts that. Points 3 to 6 are listed as "Closed", so the list mixes open
  and closed items.

## 15. Technical choices presented as the user's that the record shows as a default

Findings A-01 and A-02 above. Everything else checked is correct:
- Q16/D2 and Q17/D3 are the user's choices.
- Q18 items 3, 4 and 5 (D6, D7, D8) are the user's choices of the recommended option, and are
  labelled "the user".
- Q18 items 1, 2 and 6 (D4, D5, D9) are accepted defaults, and are labelled that way.
- Q14 and Q9 are accepted defaults, and are labelled that way.

## 16. Scope the blueprint adds beyond the PRD that is not labelled as a recorded default with a reason

None found. The additions are labelled with a reason or a decider:
- Temporary file and rename (D4).
- Extra corrupt checks (TD-7).
- The unclassified-failure stack (TD-11).
- `done` always rewrites (TD-13).
- File mode on creation, and the temporary file's name.
- Never reading environment variables.

## 17. Open points that are really product questions for the user

None found. Open point 1 (unverified versions) and open point 2 (gap handling) are technical and
process matters. The two accepted limitations (control characters in titles, no `shelf` on the path)
are closed by the user's own Q18 items 3 and 4.
