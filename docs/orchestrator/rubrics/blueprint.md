# Rubric: the technical blueprint

Standard to match: `docs/TECH-SPEC.md`. A drafter receives this file, the approved PRD, the mockup
and the user's technical answers. Where the user chose, the choice is authoritative and is not
re-argued.

## Required sections

1. **Profile and fit.** Stack, where it runs, and why it suits this PRD in two or three sentences.
2. **Layers and dependency direction.** The parts, and which may depend on which. One-way.
3. **Requirements by layer or phase.** Every `REQ-nn` appears exactly once, cited by the ID the
   PRD gave it. A table is enough. A requirement in no layer, or in two, is a blocker.
   **The blueprint never creates a requirement ID.** If the PRD has no IDs, or a requirement you
   need has none, stop and report it as a gate-3 failure. Numbering the requirements yourself
   inverts the traceability and is a defect, however convenient it looks.
4. **Verification register.** One row per acceptance criterion:

   | Criterion | Mechanism | Evidence it produces |
   |---|---|---|

   The mechanism is an automated test, a check, or a named human review. The evidence is the
   artifact a reader can inspect afterwards — a test result, a report, a recorded review. "The
   agent confirms it" is not evidence and is a blocker. A human-review mechanism names **both**
   steps: the agent pre-review that precedes it, with the conversation trail among its inputs, and
   the person's own record, which is what the row points at. The pre-review's report is an input to
   the review, never the evidence that closes the row.
5. **Security controls.** Per requirement that accepts input or identity: what is validated, what
   happens on missing, malformed and unauthorized input, and what is never logged or stored.
6. **Configuration.** Every setting, its default, and whether it is required at start.
7. **Data.** The tables or stores, keys, and what guarantees uniqueness or ordering where the PRD
   depends on it (for example "exactly one active loan per item").
8. **Concurrency.** Every place two users can act on the same object at once, and what the design
   does about it. Silence here is a blocker when the PRD has shared objects.
9. **Stories and integration.** The intended split, dependency order, and which story owns which
   files. Detail belongs to the eval plan; this section states the shape.
10. **Decisions.** Each significant decision with who decided: the user, a recorded default, or a
    cited PRD clause. A decision that cites a clause *and* records a question to the user is
    rejected — one or the other.
11. **Open points.** What remains undecided, and what it blocks.
12. **Production-readiness review.** One line per concern of `PRACTICES.md` section A: in scope
    with the decision and who made it, or excluded with who excluded it and what would bring it
    back. A paragraph excluding "production concerns" in general is a blocker; each concern is
    answered on its own line. Concerns the stack brings beyond section A (a mobile application's
    secure storage on the device, for example) are listed and answered the same way.
13. **Conventions.** The practices of `PRACTICES.md` section B made concrete for this stack: for
    each, the tool, its pinned version, the file under `eval/` that holds its configuration, and the
    rule in one sentence. It names every tool the acceptance tests' conventions step (`PRACTICES.md`
    section C) will run. It carries the layout as a tree, one line per folder, and the limits on
    file length, function length and complexity with the linter rules that enforce them
    (`PRACTICES.md` section B, Layout). Every practice of section B appears, either made concrete
    or with one sentence saying why it does not apply to this stack. Every builder is bound to this
    section through its brief and its preamble, and the fresh reader is handed it with each diff. A
    convention that names no tool and no file is a wish, not a convention, and is listed as a
    defect.

## Rules

- **The technical work belongs here, and the acceptance tests do not verify it.** Status codes,
  schemas, module and file names, libraries, build tools, log formats, header parsing and
  configuration are recorded in this document and nowhere else. A register row may *use* a
  technical surface — the API, the database — to observe a business outcome, but it never names a
  technical choice as the thing being verified. Where the user decided one, name them as the
  decider and keep it here.
- The blueprint adds no requirement. A need discovered here becomes an open point or a PRD change
  request, never a new capability introduced in the design.
- Every mechanism in the register must be runnable by the build side as described. A mechanism
  that needs a tool, a service or a browser the build environment lacks is an open point.
- Production concerns the PRD excludes stay excluded and are listed as such, one line each in
  section 12, with who excluded them. Exclusion is a decision and has a decider like any other.
- A practice from `PRACTICES.md` that the blueprint neither adopts, adapts nor declines is an open
  decision, not a silent default. The checker lists it; the orchestrator brings it to the user with
  the recommended default and its cost.

## Checker's verdict

Report first whether any requirement ID originates here rather than in the PRD; that is a blocker
and sends the work back to gate 3.

Then: requirements placed exactly once (list exceptions), criteria with no register row (list
them), register rows whose evidence is an agent's claim (list them), requirements accepting input
with no failure behaviour (list them), shared objects with no concurrency answer (list them),
decisions with no decider (list them), concerns of `PRACTICES.md` section A with no line in the
production-readiness review (list them), concerns the stack brings beyond section A with no line
(list them), conventions of `PRACTICES.md` section B with no tool, version or configuration file
named (list them), practices of section B neither made concrete nor declined with a reason (list
them), and a Conventions section with no layout tree or no size limits (say so). Any item in those
lists is a blocker.

Then, as findings rather than blockers: every production-readiness default that falls below the
recommendation in `PRACTICES.md` without a recorded reason, so that the orchestrator can bring it
to the user as a costed decision.
