# Gate 4 findings: technical blueprint of shelf

Artifact: `docs/TECH-SPEC.md` (revision 1), blueprint of PRD revision 5.
Rubric: `docs/orchestrator/rubrics/blueprint.md`, "Checker's verdict".
Other inputs read: `docs/PRD.md` (rev 5), `docs/orchestrator/PRACTICES.md`,
`docs/orchestrator/RUNTIMES.md` ("What the gate needs from any runner"), `docs/PREPARATION-STATE.md`
(Q1 to Q17, D1 to D3 only). I also read `.github/workflows/pod-gate.yml` and
`.github/scripts/runtime.sh` once, to check the blueprint's claim about the gate machine.

Verdict in one line: 1 blocker (B-01), 9 advisories. The register is complete and one-to-one with the
PRD. The conventions section is nearly complete, but one practice has no tool, version or
configuration file.

## 1. Does any requirement ID originate in the blueprint?

None found. The blueprint cites REQ-01 to REQ-09 only. These are the nine ids the PRD gives. The
header states that it creates none, and section 3 and section 4 use no other id. The row ids
`T-REQ-nn-…` are placeholders assigned at gate 5. They are not requirement ids.

## 2. Requirements placed exactly once

None found as exceptions. Section 3 places REQ-01 to REQ-05 under Rules and REQ-06 to REQ-09 under
Store. All nine appear once and none appears in both layers. The boundary is stated to own no
requirement.

## 3. Criteria with no register row

None found. I counted the register rows against the PRD's 80 criteria:

| Requirement | PRD criteria | Register rows |
|---|---|---|
| REQ-01 | 14 | 14 (c1 to c14) |
| REQ-02 | 7 | 7 |
| REQ-03 | 14 | 14 |
| REQ-04 | 14 | 14 |
| REQ-05 | 5 | 5 |
| REQ-06 | 7 | 7 |
| REQ-07 | 5 | 5 |
| REQ-08 | 4 | 4 |
| REQ-09 | 10 | 10 |
| Total | 80 | 80 |

Each criterion is keyed by one row. No row is duplicated and no row cites a criterion the PRD lacks.

## 4. Register rows whose evidence is an agent's claim

None found. Every row's evidence is "its `rows.txt` line", which the runner writes from the `node --test`
TAP output. For the ten permission rows, the evidence when the gate runs as root is "the gap recorded
at gate 5". That is a recorded artifact, not an agent's claim. Whether it can be recorded at all is
A-01 below.

## 5. Requirements accepting input with no failure behaviour

None found. Section 5 gives missing, malformed and unauthorized behaviour, or "Not applicable" with a
reason, for REQ-01 to REQ-09. The message table in section 10 covers each case.

## 6. Shared objects with no concurrency answer

None found. Section 8 answers for `shelf.json`, the one shared object: no lock, last write wins, and
the temporary-file name is shared and unguarded. The decider label is questioned in A-02.

## 7. Decisions with no decider

None found. Every TD-1 to TD-19 row names a decider. The quality of several labels is covered in
A-02 and A-03.

## 8. Section A concerns with no line

None found. All 26 concerns are answered on their own line in section 12: 8 Security, 8 Reliability,
4 Observability and 6 Delivery and data. No blanket exclusion paragraph is present.

## 9. Stack-specific concerns with no line

None found. Section 12 has a table of seven stack concerns. Two are "Not decided" and point to open
points 3 and 4. Those are product questions (A-06, A-07), not missing lines.

## 10. Section B conventions with no tool, version or configuration file

**B-01 (blocker, blueprint-change).** The "Commits" practice names no tool, no version and no
configuration file.
- Basis: the "Commits" row reads "git, no extra tool: one story per branch; messages say what changed
  and why in plain English; held by the fresh reader (no tool applies to prose)."
- The rubric lists "a convention that names no tool and no file" as a defect.
- The row is neither made concrete nor declined as "does not apply to this stack".
- A smaller instance of the same kind: "Layering" and "Layout" say the layer-per-file rule "is held by
  the layout check" (step 5 of the conventions step). That check is named, but no tool or version is
  given, nor a file under `eval/` that holds it. Step 5 is a shell check inside `eval/run.sh`, and
  `grep` in step 4 is likewise unversioned. I count this as part of B-01 and not a separate blocker.

Naming, Comments, Errors, Formatting and lint, Limits, Dependencies and Layering do name ESLint
9.39.1 or Prettier 3.6.2 with `eval/conventions/eslint.config.mjs` or `prettierrc.json`. I accept the
row-level references to the versions pinned in the conventions step.

## 11. Section B practices neither made concrete nor declined with a reason

None found. All fourteen practices of section B appear in the table. These are Layering, Layout,
Limits, Errors, Logging, Configuration, Dependencies, Types, Formatting and lint, the builder's own
tests, Naming, Comments, Commits and the client. Logging, Configuration, Types, the builder's own
tests and the client are declined with a reason. Commits is the only row that is neither (B-01).

## 12. Conventions section: layout tree and size limits

Both are present. The tree is in "Layout", one line per folder. The limits are 300 lines (`max-lines`),
50 lines (`max-lines-per-function`) and complexity 10 (`complexity`), in ESLint flat config. The
conventions step names every tool it runs. These are `npm ci`, ESLint 9.39.1, Prettier 3.6.2, `grep`
and the layout check.

## Findings (advisory)

**A-01 (advisory, user-decision): the permission rows have no representation in `rows.txt` when the
gate cannot run them.**
- Basis: Open point 2: "Undecided: how a gap shows in a run, since `rows.txt` and `eval/deferred.txt`
  (which needs a defect id from the founder) have no entry for 'cannot run'."
- RUNTIMES.md allows only `pass`, `fail` and `deferred <id> D-<k>` lines, and says "A row that is
  skipped did not run, and counts as a failure."
- Ten rows are affected: REQ-07 c1 to c5, REQ-08 c1 to c4 and REQ-03 c12.
- Against that, the gate runs on `ubuntu-latest` as a non-root user (`pod-gate.yml`), so the gap is
  not expected at the gate. It matters only for a root run elsewhere. Q10 directs a recorded gap for
  REQ-08 only; the extension to REQ-07 and REQ-03 c12 is a labelled recorded default.
- The blueprint discloses the problem, so this is not hidden. The decision is the user's.

**A-02 (advisory, blueprint-change): the decider of the concurrency answer is shown as a PRD clause,
but the PRD does not speak to it.**
- Basis: section 8 and TD-17: "The PRD has one role, one person, and lists serving more than one
  person as a non-goal… so two shells acting on it at once is out of scope. Decider: PRD clause."
- The PRD non-goal is "serve more than one person". It says nothing about one person running two
  commands at once, or about lost updates.
- Accepting last-write-wins for the one person's two shells is an inference. It is not a clause. It
  is also below the PRACTICES.md section A "Shared objects" recommendation, and the reason recorded
  there is "a file has no lock".
- It should be labelled a recorded default, with the cost (a lost update) stated.

**A-03 (advisory, blueprint-change): technical choices presented under the user's name that the
record shows as the blueprint's own.**
- Basis 1: TD-3 is decided by "the user (Q17, D3)". It also carries the pinned versions, and the
  Conventions section adds `singleQuote: true`, `printWidth: 100`, `camelcase`, `no-warning-comments`,
  `no-restricted-imports` and `no-restricted-globals`, the `noInlineConfig` setting and the layout
  check. The Formatting row ends "(D3)". D3 records only: pinned ESLint and Prettier, a lockfile,
  ESLint length and complexity limits, and the forbidden-in-app check. Open point 1 itself says the
  versions are unverified "no registry was consulted".
- Basis 2: TD-5 says "the user (Q14, recorded default accepted)". Q14 is recorded as `default`, not
  `product`.
- Basis 3: section 12 "Validation of input" says "Decided by the user (Q15, Q9)". Q9 is `default`.
  Also, "the rules trust what the store returned" is not in either answer.
- Basis 4: section 12 "Dependencies" cites "(user, D2, D3)" for refusing any import that is neither
  `node:` nor relative, and for refusing a `package.json`. D2 and D3 do not record the import rule.
- The user's choices are real, but the details are recorded defaults and should say so.

**A-04 (advisory, blueprint-change): several section A exclusions are labelled "Excluded by the user"
where the record shows no such answer.**
- Basis: Health, Timeouts, Request identity and Metrics and alerting, and Transport and Cross-origin,
  are marked "Excluded by the user (scope…)". The gate 1 scope in PREPARATION-STATE says only that
  shelf is not "a web app, a server or use a database", with no search, ratings or dates.
- Q1 to Q17 contain no answer on health, timeouts, metrics, request identity or transport.
- The exclusions follow from the scope, but "metrics and alerting excluded by the user" is the
  blueprint's inference. The rubric requires a decider, and this is a recorded default derived from
  scope.
- Identity and authorization is better supported by PRD section 3 ("One role").

**A-05 (advisory, blueprint-change): behaviour and constraints the PRD and the user's answers do not
ask for.** Each is disclosed and mostly labelled a recorded default.
- Basis 1: TD-11, "A failure that is none of the above… exits 1, prints `shelf: unexpected error` and
  the error's stack on stderr", is a new behaviour. The PRD has no requirement on unclassified
  failures.
- Basis 2: TD-8 and section 7, temporary file and rename. The blueprint says "the alternative (direct
  `writeFileSync`) is simpler and meets every criterion". It adds crash-safety, a `.shelf.json.tmp`
  file and a `W_OK` pre-check, none of which any criterion asks for. It is disclosed and open to the
  user, so I classify it as scope beyond the PRD, not as a hidden default.
- Basis 3: section 7's corrupt tests go beyond the PRD's four examples. Two books sharing an id,
  `nextId` not above every `id`, a bad `status` and an empty title all make a file corrupt. The PRD
  says "not what shelf itself writes", so this is arguably within the definition, but the cases are
  the blueprint's.
- Basis 4: the Conventions section adds the layout check that fails the run on any extra file under
  `app/` or any `package.json` at the root. D2 fixes three files; the failing check is the
  blueprint's enforcement.

**A-06 (advisory, user-decision): open point 3 is a product question.** Titles containing a newline or
escape sequence.
- Basis: "The PRD fixes the printed line but is silent on a title that holds a newline… Nothing here
  sanitises or refuses it. Needs a PRD change request if wanted."
- This concerns what a valid title is, which is a product matter. The blueprint correctly adds no
  behaviour. The user decides whether a PRD change is wanted.

**A-07 (advisory, user-decision): open point 4 is a product question.** Whether the product runs as
the command `shelf`.
- Basis: "The PRD names `shelf add …`, but with no `package.json` there is no `bin` entry… the reader
  runs `node app/shelf.mjs …`… Blocks nothing at the gate."
- Every PRD criterion is phrased `shelf add`, `shelf list` and so on. The blueprint's register tests
  `node app/shelf.mjs`. Whether `shelf` must be a command on the path is the user's to say, and D2
  (no `package.json`) constrains the answer.

**A-08 (advisory, user-decision): open point 5 is a product question.** Fields other than `nextId` and
`books` in `shelf.json`.
- Basis: "neither refused nor preserved when the file is rewritten (TD-6, section 7). The user may
  prefer to refuse them as corrupt, or to preserve them."
- Whether hand-added fields are corrupt follows from the PRD's "what shelf itself writes". The
  blueprint has silently chosen "ignore and drop". Its own text offers the question to the user, yet
  TD-6 is labelled a recorded default.

**A-09 (advisory, user-decision): production-readiness defaults below the `PRACTICES.md`
recommendation, to be brought to the user as costed decisions.**
All have a recorded reason, so none is silent. The user has not decided any of them; each is labelled
a recorded default or scope.
- *Types* (B, Types; C, Types): untyped JavaScript. Reason recorded: no type checker was chosen by
  the user. Cost: no static type check on the three files.
- *Dependency audit* (C): declined, "nothing to audit". The reason is true of `app/` but not of
  `eval/conventions/`, which has its own lockfile of ESLint and Prettier and their transitive
  dependencies.
- *Secret scan* (C): declined because "gitleaks is not among the tools the user chose in D3".
  Reasonable, but the user was not asked.
- *Shared objects* (A): enforcement in the data store is not applicable to a file. See A-02.
- *Configuration* (A): none, so there is no environment-based settings object or example file.
- *Logs and Errors* (A): no structured log. The unclassified failure prints its stack to stderr.
- *Reproducible build* (A): `npm ci` with an unverified pinned version (Open point 1). The lockfile
  does not yet exist. Gate 7 is to verify it.
- *The builder's own tests* (B): declined (Open point 6), "The user did not decide this explicitly".
- *Running locally* (A): the one command is stated in the blueprint only. No README or other documented
  command is planned.

## What fits the runner contract (RUNTIMES.md)

- `eval/runtime` holds `node 22`. `runtime.sh` accepts the line.
- `eval/run.sh` is run with `sh` from the root. The conventions step runs before any row and fails
  the run before `rows.txt`.
- `rows.txt` is produced from the TAP output of `node --test`, as the RUNTIMES.md sample does.
- Deferral uses `--test-skip-pattern`.
- `npm ci` in `eval/conventions` needs a registry on the gate machine; the hosted runner has one.
- The exact ESLint invocation is explicitly unproved (Open point 1).

None of these is a defect. The contract-fit problem is A-01, which is the permission-row gap.

## Plan-correction, user-decision and blueprint-change summary

| Id | Severity | Class |
|---|---|---|
| B-01 | blocker | blueprint-change |
| A-01 | advisory | user-decision |
| A-02 | advisory | blueprint-change |
| A-03 | advisory | blueprint-change |
| A-04 | advisory | blueprint-change |
| A-05 | advisory | blueprint-change |
| A-06 | advisory | user-decision |
| A-07 | advisory | user-decision |
| A-08 | advisory | user-decision |
| A-09 | advisory | user-decision |
