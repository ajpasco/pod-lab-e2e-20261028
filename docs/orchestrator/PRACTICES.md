# Practices: what production-ready means here

The acceptance tests observe the application from outside its process. They can prove that a borrow
was refused; they cannot see that the refusal was built with a bare `except`, a secret in a log
line, or a dependency nobody pinned. Left alone, each builder answers those questions in its own
style, and an application built by six builders has six styles. This file is the answer that is
written down before any builder starts.

It is a reference, not a rubric. The blueprint rubric points here and says what the blueprint must
carry; this file says what the choices are and what the recommended default is. A practice becomes
binding in one way only: the user adopts it, adapts it or declines it, and the blueprint records
who decided. A recommendation an agent prefers and nobody decided does not survive a gate
(ORCHESTRATOR.md section 3.1). Where the user takes the default, it is written down as a default,
not as their decision, exactly as a gate-2 technical default is.

## How each role uses it

- **The blueprint drafter** works through sections A and B and writes two sections of the
  blueprint: a production-readiness review (one line per concern of section A: in scope with a
  decision, or excluded with who decided) and a Conventions section (section B, made concrete for
  this stack). It names the tools of section C that the acceptance tests will run. For every
  concern of section A and every practice of section B it writes the stack's concrete form, or one
  sentence saying why it does not apply to this stack, and it adds the concerns the stack brings
  that this file does not list: a mobile application brings secure storage on the device,
  permission minimisation, signing and release channels, and obfuscation; a command-line tool
  declines the client's in one sentence.
- **The checker** reads both sections against this file and lists every concern with no decision,
  every convention the stack needs that the section does not state, every concern the stack brings
  that the review does not answer, and every default that falls below the recommendation here
  without a recorded reason.
- **The orchestrator** brings the checker's findings to the user as a costed decision list with a
  recommendation on each, as at gate 6. It recommends. The user decides. It writes neither
  section.
- **The builder** is told, in every brief and in its standing preamble, to follow the Conventions
  section, to follow the existing code where the section is silent, and to introduce no convention
  of its own. A convention it believes wrong goes in its handoff note, named, rather than being
  departed from silently.
- **The fresh reader** (`pod-works review`) is handed the Conventions section with the diff and
  names each departure from it, and each new convention the change introduces that the story did
  not ask for.
- **The acceptance tests** run the conventions step of section C, from `eval/`, against `app/`.

## A. The production-readiness review

One line per concern in the blueprint. "In scope" names the decision and who made it. "Excluded"
names who excluded it and what would bring it back. A blanket paragraph excluding "production
concerns" is a defect; equipment checkout's first blueprint had one, and this list is the repair.

### Security

| Concern | Recommended default |
|---|---|
| Where identity is established and where authorization is decided | Once, at the boundary, before routing; every handler receives an already-resolved actor and never re-parses identity |
| Validation of input | At the boundary, against a declared shape; the inside of the application trusts nothing it did not validate and re-validates nothing it did |
| Secrets | Never in the repository, the image or a log; read from the environment at start; the error for a missing or malformed secret names the setting and never its value |
| Dependencies | Minimal, pinned to exact versions in a lockfile, audited against known vulnerabilities by the acceptance tests; a new runtime dependency is a decision, named in the handoff |
| Transport | TLS terminated by the proxy or platform in front of the application, never by the application; stated, even when excluded for a trial |
| Cross-origin access and security headers | Closed unless the PRD names a second origin; the proxy sets the headers the deployment needs |
| Containers | A pinned base image, a non-root user, no secret baked in, a `.dockerignore` that excludes tests, local configuration and version control |
| What is never logged or stored | Named per requirement in the blueprint's security controls, and repeated here as the application-wide rule: no secret, no credential, no personal data beyond what the PRD requires |

### Reliability

| Concern | Recommended default |
|---|---|
| Start-up | Reads configuration once, fails fast and loudly on a bad setting, runs its schema set-up, then serves; nothing is read at import time |
| Shutdown | Graceful: stops accepting, finishes in-flight work, releases connections |
| Health | A readiness answer the platform can poll, when a platform is in scope; stated as excluded otherwise |
| Timeouts | Every outbound call has one; no call waits forever |
| Shared objects | The blueprint's concurrency section decides; the convention is that the decision is enforced in the data store (a lock, a constraint), not in application memory |
| Retries and idempotency | Named per action that a client may repeat; the default is that a repeated write is safe or is refused, never doubled |
| Schema evolution | A migration tool from the first schema change onward; stated as excluded for a trial that will be rebuilt |
| Backups and retention | A decision, even when the decision is "none for this trial"; a figure is never invented |

### Observability

| Concern | Recommended default |
|---|---|
| Logs | Structured, one record per request on a named logger, with method, path, outcome and the acting identity's id; levels used as named; nothing from the "never logged" list |
| Request identity | A request id generated or accepted at the boundary and carried into every log record of that request |
| Errors | Unexpected failures are logged once, with their stack, where they are caught at the boundary; never swallowed, never logged at every layer |
| Metrics and alerting | Stated: in scope with the platform named, or excluded with who decided |

### Delivery and data

| Concern | Recommended default |
|---|---|
| Reproducible build | Lockfiles committed; base images pinned; the same command builds locally and in the gate |
| Configuration | Through the environment, every setting listed in the blueprint with its default and whether it is required; a committed example file with no real values |
| Running locally | One documented command brings up the application and its store with test values |
| Seed data | Idempotent: running it twice leaves the same three users |
| Invariants | Enforced by the store (unique constraints, foreign keys, check constraints) where the PRD depends on them, and by the rules layer where the store cannot |
| Time and identifiers | UTC in the store; identifiers generated by the store, never by the client |

## B. Conventions

The blueprint's Conventions section makes each of these concrete for the stack it chose: the
tool, its pinned version, the file that holds its configuration, and the rule in one sentence.
A convention that names no tool and no file is a wish.

- **Layering.** The layers of the blueprint's section 2, and the rule that a module imports only
  from its own layer or the one below. Rules live apart from input and output: the module that
  decides never performs the request, and the module that performs never decides.
- **Layout.** Layering says which layer may import which; the layout says where each one lives,
  and the blueprint names it for its stack as a tree: the layers of its section 2 as folders or
  packages, with one line per folder saying what belongs in it and what never does. A module holds
  one concern, one concept of the domain; a file that mixes layers, or one module that holds the
  whole of a layer, is a departure. Where the language is object-oriented, a class is used where
  state and behaviour belong together (a repository per aggregate, a service per family of use
  cases, typed models and schemas apart from both) and plain functions carry pure computation; a
  class that only wraps a function is a departure too. The blueprint sets a limit on the length of
  a file (recommended: 300 lines), on the length of a function (recommended: 50 lines) and on its
  complexity, and names the rules of the pinned linter that enforce them: ruff `C901`, `PLR0912`,
  `PLR0913` and `PLR0915`, with pylint `C0302` or an equivalent for the length of a file; ESLint
  `max-lines`, `max-lines-per-function` and `complexity`; detekt `LongMethod`, `LargeClass`,
  `ComplexMethod` and `TooManyFunctions`; SwiftLint `file_length`, `function_body_length` and
  `type_body_length`. A limit the stack's linter cannot express is written anyway, and the fresh
  reader holds the builder to it. A utilities package holds only code with no domain knowledge; a
  helper that knows a business word belongs in the layer that owns that word.

  Examples by stack, each a sketch for the drafter to pitch and the user to decide:

  - *A FastAPI service.* `routers/` HTTP only: parse the request, call one service, shape the
    response; `services/` the use cases; `repositories/` persistence, one per aggregate; `models/`
    (the store's) and `schemas/` (the wire's) apart; `core/` settings, the error taxonomy and the
    one handler that maps it to HTTP; `utils/` nothing with a domain word.
  - *A React client.* `pages/` one per screen; `components/` render and delegate; `hooks/` state
    and effects; `api/` the calls to the server. Data is fetched only in `api/` and the hooks that
    use it, never in a component.
  - *A native Android app in Kotlin.* `ui/` composables or views and their ViewModels; `domain/`
    use cases and models with no Android import; `data/` repositories and their sources;
    dependency-injection wiring in one place. Nothing in `ui/` touches a data source.
  - *Any other stack* gets the same shape in its own idiom, named in the blueprint as a tree.
- **Errors.** One taxonomy of failures, defined once, raised by the rules layer and mapped to the
  outside world in one place at the boundary. No bare `except`, no swallowed exception, no error
  turned into a default value without a decision that says so.
- **Logging.** One logger per concern, named; structured records; the levels and what belongs at
  each; the list of what never appears.
- **Configuration.** A typed settings object loaded once at start, from the environment, with the
  blueprint's defaults; nothing reads the environment anywhere else.
- **Dependencies.** The lockfile is the truth; a dependency is added only for a need the story
  states, is pinned, and is named in the handoff with its reason. Nothing a builder adds is ever
  installed into the environment that grades it.
- **Types.** Typed code where the language offers it; the type checker named in section C passes
  with no suppression that is not explained in a comment on the line.
- **Formatting and lint.** One formatter and one linter, pinned, with configuration frozen in
  `eval/`; the code is formatted before it is committed and the acceptance tests check that it is.
- **The builder's own tests.** Allowed under `app/`, run by the builder, never by the acceptance
  tests; they judge nothing and are never a reason a row may be skipped.
- **Naming.** Files, modules and functions named for what they are in the domain's words (the
  PRD's words), not for how they work. Where they go is the layout's to say.
- **Comments.** Say why, never what; no commented-out code; no `TODO` left in a story that is
  done, since a story that is done has nothing to do.
- **Commits.** One story per branch; messages say what changed and why, in plain English.
- **The client.** Where there is a browser client: no secret and no configuration baked into the
  bundle beyond the public base URL; every control labelled for a screen reader; no console output
  in the production build.

## C. The conventions step in the acceptance tests

Judgement catches departures from a stated convention; a tool refuses them. Where a tool exists, the
acceptance tests run it. The step is part of `eval/run.sh`, lives in `eval/`, and is a builder's to
change no more than any row is.

What the step may contain, each pinned to an exact version with its configuration in `eval/`:

| Check | Example tools |
|---|---|
| Formatting | `ruff format --check`, `prettier --check` |
| Lint | `ruff check`, `eslint` |
| Types | `mypy`, `tsc --noEmit` |
| Dependency audit | `pip-audit` on the lockfile, `npm audit` at the chosen level |
| Secret scan | `gitleaks` over the tree |
| Container lint | `hadolint` on each Dockerfile |

Rules of the step:

1. **It is not a row.** It asserts no business outcome and traces to no requirement, so it has no
   test id, no Given/When/Then and no state before the build. The eval plan rubric's rules about
   rows do not apply to it; the rule that nothing in `eval/` is a builder's to change does.
2. **It runs against `app/` only**, from `eval/`'s own pinned tools, and **every tool is passed
   its configuration explicitly**. Most tools also look for configuration in the tree they are
   given: gitleaks reads a `.gitleaks.toml` and a `.gitleaksignore` from the folder it scans,
   bandit a `.bandit` under its target even when another file is named, ruff and ESLint the ignore
   files of the tree, and any of them placed under `app/` by a builder would switch a check off.
   The frozen configuration under `eval/conventions/` is the only one read: named on the command
   line, with `app/` mounted or addressed so that no file of the builder's is in the place a tool
   looks. The pull request that adds a tool shows this by planting the builder's file in a scratch
   tree and showing the finding still made.
3. **An empty `app/` has nothing to check, and the step passes.** This is the one place a vacuous
   pass is honest, because the step protects form and not behaviour, and the rows already fail by
   absence.
4. **It runs clean on the code that exists when it is introduced.** A step that fails on the
   current trunk would block the next story for reasons the story did not cause. Each tool is
   added only once it has been run against the trunk's `app/` and passed, and the pull request that
   adds it says so with the output.
5. **Its tools are named in the blueprint's Conventions section**, so the builder knows what
   will be run before it starts.
6. **Its failures are read in the gate's eval log**, like a failing row, and are the builder's to
   fix inside its scope. A finding the builder believes wrong goes in the handoff.
7. **A suppression is a departure.** A line that turns a check off is named in the handoff with its
   reason, and the fresh reader reports every one it finds.
8. **No file under `app/` names the acceptance tests' runner, reporter or report path.** The
   step refuses any match against `eval/conventions/forbidden-in-app.txt`, a list of patterns a
   real stack extends with its own runners, reporters and report folder. A row whose test process
   imports the builder's code is graded by a process that has run that code, so a build could
   write its own passing report; this catches the lazy version, which names its target. The fresh
   reader's checklist item 7 catches the version a person can see in the diff, and the eval plan
   rubric's coverage rule 5, which never lets such a row be a criterion's only evidence, makes the
   rest pointless.

## D. What this file is not

- Not a substitute for a row. A convention protects how the application is built; only a row
  protects what it does.
- Not style for its own sake. Every line above exists because its absence has cost someone a
  production incident or a week of reading six builders' code.
- Not a ceiling. A stack may need a convention this file does not list; the drafter adds it to the
  blueprint's section with who decided, and this file is amended afterwards so the next project
  starts with it.
