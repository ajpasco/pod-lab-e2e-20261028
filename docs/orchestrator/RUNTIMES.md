# Running it: Claude Code CLI, Codex CLI

[ORCHESTRATOR.md](ORCHESTRATOR.md) is the process and it does not change between runtimes. What
changes is how a role gets its own session and how the user is prompted. Nothing here requires a
service, a plugin or a network call; the state file and the rubrics are the whole machinery.

Two rules hold everywhere:

1. **A checker runs in a session that started for that task.** Not a new message in the drafting
   conversation. A fresh process, a fresh subagent, or a fresh terminal — whichever the runtime
   gives you.
2. **The state file is the memory.** If a session dies, the next one reads
   `PREPARATION-STATE.md` and continues. Nothing important lives only in a transcript.

## Claude Code CLI, on its own

The smallest setup, and the baseline Codex matches.

- Start it with the `pod-works-prepare` skill, `.claude/skills/pod-works-prepare/SKILL.md`, giving
  the project name, or with: *"Act as the preparation orchestrator. Follow
  `docs/orchestrator/ORCHESTRATOR.md`. The project is <name>."* The `prep-orchestrator` agent,
  `.claude/agents/prep-orchestrator.md`, is the same role as a subagent definition.
- The orchestrator session plays the orchestrator role only.
- Drafters and checkers are subagents, one per artifact, launched with the Agent tool using
  `.claude/agents/prep-drafter.md` and `.claude/agents/prep-checker.md`. A subagent gets its own
  context, which is what makes the checker's independence real.
- The orchestrator passes a checker only the artifact paths and the rubric path. It does not
  summarise the drafting discussion into the prompt; that is how independence gets lost.
- The user answers in the terminal, one question at a time.

No service and no server. A copy of `docs/orchestrator/`, the skill and the three
`.claude/agents/prep-*.md` files is enough to run the preparation in any repository.

### One harness limit worth knowing

A Claude Code subagent may be refused permission to write files ("Subagents should return findings
as text, not write report files"). A checker that hits it returns its review as text instead. The
orchestrator then transcribes that text into the findings file itself, says in the file's header
that it did so and why, and keeps its own verification and any reclassification in the state file
rather than mixing them into the checker's words. Independence is unaffected: the checker still ran
in its own session with only the artifacts and the rubrics. Do not work around it by giving the
checker a drafting role.

### Headless, with `claude -p`

The orchestrator can run without a terminal: `claude -p "/pod-works-prepare <name>"` from the
repository, then `claude -p --resume <session id> "<the user's answer>"` for every question, with
`--permission-mode acceptEdits` and an `--allowedTools` list. Two things to know. A headless run
returns only the final turn's text, so anything the user must act on, a command list above all,
goes in the orchestrator's last message every time, never in an earlier one it then refers back
to. And every command the orchestrator runs must be on the allowlist: the preparation runs
`sh`, `git`, `node`, `npm`, `python3`, `docker`, `mkdir`, `cp`, `mv`, `ls`, `cat`, `head`,
`tail`, `grep`, `find`, `sed`, `mktemp`, `printf` and `shasum` (for the state file's hashes;
`python3 -c` with `hashlib` is its fallback), and `pod-works` itself.

## Codex CLI

Codex has no subagent primitive, so a role boundary is a process boundary.

- Point Codex at the process from `AGENTS.md`:

  ```
  ## Preparation
  When asked to prepare an application, act as the preparation orchestrator and follow
  docs/orchestrator/ORCHESTRATOR.md. Keep PREPARATION-STATE.md updated after every step.
  ```

- A drafter is a separate non-interactive run whose prompt is the rubric plus the input paths:

  ```sh
  codex exec "Draft the PRD for <project>. Follow docs/orchestrator/rubrics/prd.md exactly.
  Inputs: PREPARATION-STATE.md (scope and answers only). Write docs/PRD.md. Write
  nothing else."
  ```

- A checker is another separate run, and it must not be the run that drafted:

  ```sh
  codex exec "Review docs/PRD.md against docs/orchestrator/rubrics/prd.md. Output the
  rubric's verdict section as findings.json. Change no file but findings.json."
  ```

- The interactive session stays the orchestrator: it asks the user, reads findings files, updates
  the state file, and decides whether a gate passed.

Same gates, same rubrics, same refusals. The only loss against Claude Code is convenience.

## Orca

Not built. The repository's own README lists an Orca backend as planned. Until it exists, Orca is
at most a place to open the same Claude Code or Codex sessions described above, under the same
two rules; it adds nothing to the process.

## What the gate needs from any runner

The runtimes above prepare the acceptance tests; the gate runs them, on any stack, and knows none
(decisions 17 and 18). Whatever the language or framework, it needs five things from `eval/`:

- **`eval/runtime`**, what the gate's machine must have, one line each: `node 22`, `python 3.12`,
  `java 17`, `runner macos-14`, `android`. Anything else is the tests' own job, in a container or
  in `eval/run.sh`.
- **`eval/run.sh`**, run with `sh` from the repository's root with `app/` beside `eval/`. Its exit
  status is the verdict: zero when every row passes, non-zero otherwise. A row that is skipped did
  not run, and counts as a failure.
- **`eval/report/rows.txt`**, written by `eval/run.sh` on every run: one line per row, `pass <id>`,
  `fail <id> <one-line reason>` or `deferred <id> D-<k> <one-line reason>`, fields separated by
  single spaces, the id with no space in it. The gate and the preview print its failing rows, then
  its deferred rows apart, ahead of the log's tail; they never count a deferred row as failing, and
  parse no
  framework's output, so how the file is produced is the project's business: from the framework's
  own machine-readable report (JUnit XML from pytest, Gradle or Vitest; TAP from `node --test`, as
  the sample does) or a reporter hook. Delete it at the start of a run, so a stale one is never
  read. A step that is not a row, such as the conventions step, fails the run before any rows file
  is written, or the preview could take its failure for a row's. Once it is written, the file
  accounts for every non-zero exit: a row that should have run and did not is written
  `fail <id> did not run`, and a step that fails after the rows, a crash outside any test or a
  check of the report, adds a `fail <step> <reason>` line of its own. A runner that writes no file
  still works: the gate says so in one line and shows the log. The file and anything else the
  runner writes beside it stay out of git: the report directory is ignored (the sample ships
  `eval/.gitignore` with the line `report/`, and `pod-works init` adds `eval/report/` to
  `.gitignore`), so neither a builder's commit nor the freeze ever carries a run's report.
- **`eval/deferred.txt`**, when the founder has deferred a defect (INCREMENT.md section 9): the row
  id first on each line, its defect id `D-<k>` beside it, `#` comments and blank lines allowed. Its
  reading is the approval console's, `parseDeferred` in `cli/src/console/state.ts`: the line
  trimmed, the first word the row, the first whole word `D-<k>` after it the defect. Honouring it
  is the runner's job, because the gate knows no stack. **A runner defers a row by leaving it out
  of the run whose exit status is the verdict, with its framework's own switch for deselecting
  tests by name, never by editing the report after the fact**: `node --test --test-skip-pattern`,
  as the sample does; `pytest --deselect` or `-k "not ..."`; Vitest's `--testNamePattern` with an
  exclusion or its `exclude` setting; Gradle's `test { filter { excludeTestsMatching } }`. Match
  the whole id, escaped, so that deferring `T-01` never leaves out `T-010`. The verdict run's
  exit status is then the verdict, unread and unedited. A second run, of the listed rows only,
  supplies the report and nothing else, its exit status ignored: a listed row that fails is
  written `deferred <id> D-<k> <reason>`; one that passes is `pass <id>`, and the gate notes that
  the list names a passing row; one that is skipped, or that the second run finished without
  reporting, is a `fail`, which fails the run. The report may add a failure to the verdict and
  never removes one. A line with no `D-<k>` defers nothing: its row runs in the verdict run as any
  other. A deferred row must still finish: one that kills its process (`process.exit`) did not
  run, and fails the run. Read the list before any row runs, so the app's code cannot add to it
  mid-run, as the sample's runner does. The sample's skip and name patterns need node 22.1 or
  later, which `node 22` on the runner provides. The gate reads main's list and the preview the pull request's, each only
  for that note.
- **`eval/stories/<n>.expect`**, in a packet only: one `fail <id>` line for each row of story `<n>`
  that fails against main's `app/` before the story is built. `pod-works preview` reads the
  `.expect` files the pull request adds or changes, and reports `pod/preview` = `success`, "as
  expected", when the run fails on exactly those rows; any other row failing, or a named row
  passing, is a `failure` that names it.

## Porting it to another repository

Today a founder's repository gets its two halves separately:

- **The gate**, from the command. `pod-works init`, run inside the repository, stamps the gate's
  workflow and script into `.github/` (and a sample `eval/` and `app/` into an empty repository).
  After the first push to GitHub, `pod-works protect` requires the `pod-gate` check on main and
  binds administrators to it. Both are the founder's acts; protect needs administrator rights.
- **The preparation**, by copying. Copy `docs/orchestrator/` and `.claude/` (the
  `pod-works-prepare` skill and the `prep-*.md` agents) into the repository. Add the `AGENTS.md`
  paragraph if the team uses Codex. Copy `STATE-TEMPLATE.md` to `docs/PREPARATION-STATE.md` and
  fill in the project name.

There is no `pod-works` verb that does the copying.
