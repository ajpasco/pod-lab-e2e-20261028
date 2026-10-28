# The build: what happens after gate 7

[ORCHESTRATOR.md](ORCHESTRATOR.md) turns an idea into a contract and its acceptance tests: the tests
written from the requirements before the build and locked so the builders cannot change them. It
stops when they are on main. This file covers the build: one builder per story, inside the gate
GitHub enforces, until every story has merged. [INCREMENT.md](INCREMENT.md) covers what follows.

The build orchestrator is a different role from the preparation orchestrator and should be a
different session: the preparation orchestrator helped write the acceptance tests; the build
orchestrator decides whether work judged by them is done. One session doing both is a drafter
checking its own artifact.

## 1. Where it starts, and what it may assume

It starts with gate 7 passed. In the founder's repository that means these are on main, having got
there through a pull request the founder approved:

- **`eval/`, the acceptance tests**: `eval/run.sh`, the runner the gate calls; `eval/runtime`,
  what the gate's machine must have; the conventions step (`eval/conventions.sh` and
  `eval/conventions/`); and **story 1's packet**: its rows, its scope file `eval/stories/1.txt`,
  one path or glob per line, and its brief `eval/stories/1.md`, whose first `# ` heading is the
  story's title. Later stories' rows are not on main yet, on purpose: main's whole `eval/` judges
  every story, so they would refuse the story being built.
- **`docs/`, the plan**: `docs/PRD.md`, `docs/TECH-SPEC.md` (the blueprint, with its Conventions
  section) and `docs/eval-plan.md`.
- **The gate**, stamped by `pod-works init`, with `pod-works protect` run once: `pod-gate` required
  on main and pinned to the Actions app, administrators bound, auto-merge enabled.
  `pod-works doctor` reads the protection back and names anything missing.

It assumes none of that on anyone's word, and `pod-works build` checks very little of it. What
`build` checks (`cli/src/build.ts`, `cli/src/repo.ts`): that `eval/stories/<n>.txt` exists in the
checkout it runs from; that `eval/stories/<n>.md` exists there, unless `--brief` names another
file; and, after the builder finishes, that it committed something, or no pull request is opened.
Nothing else. It does not check that the tests fail for the reason the plan predicts, that they were
shown satisfiable, that a fresh session reviewed them, that main is protected, or that another story
is in flight. A clean start proves nothing about the tests. Those facts are gate 7's record, and the
orchestrator confirms them from that record before the first build.

**`build` reads the scope and the brief from the checkout it runs in, not from main.** It branches
the worktree from a freshly fetched `origin/main`, but the scope listed in the builder's preamble
comes from local files, while the gate reads main's. So every build starts from main brought up to
date: `git checkout main && git pull --ff-only`.

## 2. The loop, once per story

The orchestrator session may run `build`, `wait`, `review`, `fix`, `preview`, `status` and
`doctor`, and for a packet `packet start`, `packet rehearse`, `packet open` and
`review --packet`. The founder runs `approve`, `repair` and `up`, and decides anything the reader
flags.

0. **For every story after the first, its packet first**, through the `/pod-works-increment`
   skill: for a defect, `/pod-works-increment D-<n>`; for a feature or the plan's next story, a
   short description in quotes. `pod-works packet start <n> <name>` makes the worktree
   `.pod/worktrees/packet-<n>` on a branch `eval/<name>`. A `packet-drafter` subagent writes the
   story's rows, scope file and brief, its expectations file `eval/stories/<n>.expect` (a line
   `fail <id>` for each new row, which fails by absence), and the plan's changes, if any, and
   commits them; nothing under `app/`, and none of it written by the orchestrator.
   `pod-works packet rehearse <n>` runs it locally, `pod-works review --packet <n>` has a fresh
   reader check it, and `pod-works packet open <n>` pushes it, opens the pull request and runs
   `pod-works preview <pr>`, which should say "as expected": exactly the `.expect` rows failed. The
   orchestrator reads that verdict itself, hands the founder the named rows, the verdict, the
   reader's report and `pod-works approve <pr>`, and stops there: the founder's approval is the
   one stop. Once the founder has approved, the same session reads `pod/approval` on the head,
   runs `pod-works wait <pr>` until the packet has merged, read from GitHub, and then
   `pod-works build <n>` at once, because from that merge until the story lands main refuses
   every other pull request (INCREMENT.md section 6). [INCREMENT.md](INCREMENT.md) sections 3 to 5
   are the packet's full rule.
1. **Orchestrator: `pod-works build <n>`.** It creates a git worktree at `.pod/worktrees/story-<n>`
   on the branch `story/<n>`, cut from `origin/main` (or reuses both if they exist), and starts one
   builder there: a headless Claude Code session, or Codex with `--agent codex`, given the preamble
   of section 5 and then the brief. When the builder returns, `build` writes its run record
   `.pod/runs/story-<n>-<time>.json` (session id, turns, cost), pushes the branch and opens the pull
   request `story <n>: <title>`, with the handoff note as its body. Opening it fires the gate.
2. **The reader, inside `build`.** A fresh session reads the diff (section 4). Clean, and `build`
   arms auto-merge. Flagged, and it does not; the findings are posted on the pull request.
   `pod-works review <n>` runs the same reader alone; it reports and comments, never arms.
3. **Orchestrator: `pod-works wait <pr>`.** It polls every ten seconds, for up to twenty minutes,
   until the gate has judged the head and the pull request has merged, the gate refused it, or it
   passed with no auto-merge armed, and prints the verdict. It exits 0 when the pull request merged
   **or** the gate passed, so exit 0 is not a merge: read the line under the title.
4. **On green with auto-merge armed, GitHub merges it**, squashed, with nobody clicking. The handoff
   lands on main with the code, under `.pod/story-<n>/`.
5. **On a refusal, `pod-works fix <n>`** (section 6.1). **On a reader's flag, the founder decides**
   (section 6.2).
6. **Orchestrator: `pod-works status`**, then its record (section 3). A story is done when its pull
   request has merged, read from GitHub; never because a command exited 0.
7. **QA, through the `/pod-works-qa` skill** (INCREMENT.md section 9): a fresh `qa-tester`
   subagent drives a clean copy of the merged main against the criteria the story was meant to
   fulfil, on the happy and the unhappy paths, and the founder gets one decision list. It is the
   last step of every increment, `/pod-works-qa all` comes before the founder's acceptance, and
   after a story of the first build it runs only when the founder asks. It starts no fix.

**Nothing technical keeps the orchestrator from approving.** `pod-works approve` runs through
whatever `gh` login the session has, and the orchestrator's session needs the founder's login for
`build` to push, open the pull request and arm auto-merge. `approve` refuses only a pull request
that is not open (`cli/src/approve.ts`); it does not ask who is running it. That the orchestrator
never runs it, nor sets `pod/approval` any other way, is this document's rule, kept by the role.
Builders are different: `build` starts them with an empty `gh` configuration, no token variables
and git's credential helpers off, so `gh` and `git` find no credentials. That is not a sandbox: a
builder runs as the founder's user and may run `node` and `python3` (Codex, any command), so a
credential readable from the founder's files is within its reach.

## 3. What the orchestrator writes

**Its own record, and nothing else**: one file per build session,
`.pod/runs/orchestrator-build-<date>.md`, as the first application's build kept. `.pod/runs/` is
ignored by git, so the record stays on the machine that ran the build and is handed to the next
session as a file. Per story: the main commit the build started from; the command and its run
record; the pull request and its head commit; the gate's verdict, its summary lines verbatim; the
reader's record and findings; each fix round; the merge commit; and every decision the founder made,
with the date. Everything but the founder's spoken decisions can be read again from GitHub and
`.pod/runs/`. The packet commands write their own records there,
`packet-<n>-rehearsal-<ts>.json` and `packet-<n>-review-<ts>.json`, and a QA pass its directory
`qa-<n|all>-<ts>/`. Never name a file there
`story-<n>-<anything>.json`: `pod-works fix` takes the newest
such file by name, other than the reader's `story-<n>-review-<ms>.json`, as the builder's run
record.
It writes **nothing under `app/`, `eval/` or `docs/`, and nothing on a story branch**: not a line of
the application, a row, the runner, a brief, a scope file, the PRD, the blueprint or the eval plan,
and not a handoff a builder failed to leave. A packet's files are the `packet-drafter`'s, written
in the packet worktree, never the orchestrator's. It does not fix a failing test to unblock a builder,
and it does not adjust a requirement to match what was built.

How much of that is enforced: for `eval/` and `docs/`, the gate, which needs the founder's
`pod/approval` for them and refuses them on a story branch whose scope file does not name them. For
`app/`, nothing: an edit pushed to a story branch inside its scope would pass. That part is
discipline. The orchestrator's agent definition has no `Write` or `Edit` tool, which removes the
easy path; it keeps `Bash`, which the role needs.

## 4. Evidence, and what is not evidence

- **Evidence is the gate's verdict on the head commit, read from GitHub.** The `pod-gate` check run
  is written by the Actions app from main's copy of `gate.sh` and main's `eval/`, run against the
  pull request's `app/` with the token variables removed. `pod-works wait`, `pod-works status` and
  the check-runs API all read it. Its summary is a few lines: `scope: ...`, `approval: ...` when a
  protected path changed, and `eval: main's eval passes` or `FAILS against this pull request's
  app/`. A verdict counts only for the commit it names; a new push is judged again.
- **The merge in main's history** is what makes a story done.
- **Not evidence: the handoff.** `.pod/story-<n>/handoff.md` is the builder's claim. The builder
  runs `sh eval/run.sh` in its own worktree, where it can edit `eval/` freely, so its green run says
  nothing about what main's tests say. The gate re-runs main's so the handoff need not be trusted.
- **Not enforcement: the reader** (decision 12). `pod-works review` runs a fresh Claude session
  with no tools, given four things as text: the brief from the checkout, the Conventions section of
  `docs/TECH-SPEC.md` from `origin/main`, the diff from the merge base, and the handoff from the
  branch. It answers a seven-item checklist (only what the story asked; behaviour keyed to the
  caller; new dependencies; handoff against diff; checks routed around; conventions; code that
  reaches the runner or the reports) and marks each finding `block` or `note`. Its record is
  `.pod/runs/story-<n>-review-<ms>.json`: findings, whole answer, branch, the head it read, cost.
  It fails closed: no parseable answer is a `block`. Clean decides only that a green story may
  merge on its own; the gate stays the authority. `pod-works review --packet <n>` is the same kind
  of reader for a packet, with its own checklist (INCREMENT.md section 3); it decides nothing
  either, and the founder's approval rests on it and on the preview.

## 5. The builder's constraints, and where scope does not reach

**The preamble**, which `build` puts before the brief, tells the builder: it builds story `<n>` in a
worktree on `story/<n>` and works only there; the rules are enforced by the gate on its pull
request, not by the message; it may change only the scope file's paths, plus
`.pod/story-<n>/handoff.md`; `eval/` is read-only, and a test it believes wrong is named in the
handoff, never touched; it follows the blueprint's Conventions section, or, where there is none, the
existing code and the brief, adopting no tool or convention of its own and naming in the handoff
any it thinks is needed; done means `sh eval/run.sh` exits 0 from the repository root, which needs
Docker; it commits and does not push; and it writes the handoff before it finishes: what it built,
what passes, what it could not make pass and why.

It may use without asking file edits and reads, and a fixed list of shell commands: the runner, git
reads, `git add` and `git commit`, Docker, Python, Node, `npm`, `pip` and a few file utilities.
Codex runs with its own sandbox off, because the tests need Docker. For both, the credential-free
environment and the gate are what bound it.

**The scope file is a whitelist the gate enforces.** Every path the pull request changes since its
merge base must match a line of main's `eval/stories/<n>.txt`, as a shell pattern, so `*` crosses
`/`. A path nobody predicted fails too, so a builder cannot add a file that interferes with the
tests and still merge. Most imagined attacks die here.

**The one exempt path is the handoff folder.** The gate adds `.pod/story-<n>/*` to every story's
scope: the whole folder, not only the note, so a builder may add other files there unchecked.

**`package.json` at the root is protected**, beside `eval/`, `docs/` and `.github/`. The gate runs
the tests with main's `package.json` and `package-lock.json`, never the branch's, and changing the
root one needs the founder's approval, so a builder cannot supply its own test runner. A dependency
list inside `app/` (such as `app/web/package.json`) may be in scope legitimately; the reader's
item 3 names what it adds.

**The in-process rows are where scope does not reach.** A row whose test process imports the
application's code has run the builder's code before its report is written, so a build could write
its own passing report without touching a protected file. Three answers, none complete alone: the
eval plan rubric's rule 5 never lets such a row be a criterion's only evidence, so a row from
outside the process (HTTP, browser or data store) also judges it; the reader's item 7 makes a
`block` of any code under `app/` that touches the runner, the reporter or the reports folder, or
writes, spawns or calls out when merely loaded; and the conventions step refuses any file under
`app/` matching `eval/conventions/forbidden-in-app.txt`, which names the runner, the reporter and
the acceptance tests' folder.

**A green local run proves nothing.** Scope governs what merges, not what the builder reports. A
builder may use subagents inside its worktree; the gate judges one diff either way, and the builder
answers for all of it. One builder per story.

## 6. When something goes wrong

Each ends in work going back to the builder or a decision brought to the founder, with the
options, what each costs, and a recommendation. The orchestrator reads the verdict itself.

### 6.1 The gate refuses

- **On scope**: a named file is outside the story's scope, or the story has no scope file on main.
  The builder's mistake, unless the brief cannot be done inside the scope; then it is a plan defect
  for the founder, never a scope the orchestrator asks to widen.
- **On the rows or the conventions step**: `eval: main's eval FAILS`; the gate prints the
  failing rows from the runner's `eval/report/rows.txt`, and the log's tail is in the workflow run
  behind the check. A wrong implementation goes back to the builder. A builder's claim
  that a test is wrong is demonstrated, not accepted: the orchestrator shows what the row asserts
  and why nothing inside the scope could satisfy it, and takes it to the founder. A wrong row is
  fixed by a pull request to `eval/` the founder approves (INCREMENT.md section 3).

Sending it back is **`pod-works fix <n>`**. It finds the pull request on `story/<n>`, reads the
gate's latest verdict on its head and, unless it is success, resumes the builder's session (Claude
Code or Codex, as the run record says) with the verdict and an instruction to fix what is in scope
or say in the handoff why not; then it does what `build` does: push, reader, auto-merge if clean.
Two rounds at one failure, then the founder.

Know its limits. It resumes the session named in the newest builder record for the story in
`.pod/runs/`, so it works on the machine that ran the build, and only on `story/<n>`, not a
`--suffix` branch. It was not exercised in the first application's three builds. When it stops,
the orchestrator reports its message; it does not rename records or start a fresh builder to get
round it.

### 6.2 The reader flags something

The gate may be green; the merge waits because auto-merge was not armed. The orchestrator reads the
diff where the findings point, says which it can confirm, and brings the founder a decision. In the
approval console (`pod-works up`) the founder can:

- **Merge anyway**: the console runs `gh pr merge <pr> --squash`; GitHub still requires `pod-gate`
  green on the head.
- **Send it back**: the console runs `pod-works fix <n>`. On a green gate, `fix` reads the
  reader's newest record; if it is about this head and holds a `block`, the builder's session is
  resumed with those findings, then push, reader and auto-merge if clean, as `build` does. A
  record about an older head, or one with no `block`, is "nothing to fix", and the orchestrator
  says so rather than reporting the story as sent back.

`pod-works approve <pr>` arms auto-merge on a story too, so it also lands a flagged story on green.

### 6.3 Main's acceptance tests are broken

If main's tests fail against main's own `app/`, every pull request is refused, the fix included.
That is the gate holding. The recovery is **`pod-works repair`**, the founder's: from a checkout on
`main` holding the fix, it removes administrator enforcement from main's protection, pushes main,
and restores it in a `finally` whatever the push did. Enforcement is lifted for that one push, and
the commit pushed never passes the gate. GitHub's audit log records both changes. If the restoring
call fails, enforcement stays off until someone restores it, so the founder reads it back after.

### 6.4 The builder goes silent, or runs out of turns

`build` runs the builder in the foreground and returns when its process does. `--max-turns <n>` caps
a Claude Code builder's turns; it is not passed to Codex.

- **The agent's process failed**: `build` stops with its error before writing a run record or
  pushing anything.
- **It committed nothing**: no pull request, exit 1. `pod-works build <n>` again starts a fresh,
  not resumed, session in the same worktree, whose uncommitted edits are still there; the
  orchestrator reports them first. `fix` cannot help: it needs a pull request.
- **It committed but wrote no handoff**: the pull request opens with "No handoff note was written",
  and the reader is handed that sentence in the note's place and judges the diff without it; its
  item 4, the handoff against the diff, is where that shows. The orchestrator does not write the
  note; it reports to the founder.

### 6.5 Which story is next, and whether two may run at once

Stories run in their numbered order unless the plan says otherwise; a scope file has no dependency
field, so an order that matters is in the plan's prose. The first application built its three
stories one after another, each from main after the previous merge. That is the recommendation.

Two can run at once, each in its own worktree and branch, once the orchestrator has checked their
scopes do not overlap, because nothing else does; a shared directory prefix counts as overlap,
since builders mostly create files. Then, when the first merges:

- The scope check reads the diff from the merge base, so a stale base does not trip it.
- The rows run against **the branch's own `app/`**, not the merged result. A branch cut before the
  first story merged lacks its code, so if judged afterwards, main's tests fail on it.
- The gate is not re-run when main moves: it fires when a pull request is opened, pushed or
  reopened, and on `pod/approval`. A second pull request already green and armed merges on that
  verdict, and the merged `app/` is first tested by the next pull request. Main's protection does
  not require a branch to be up to date.

Bringing a branch up to date is not a pod-works verb; the orchestrator reports the need.

## 7. When a requirement changes while building

The orchestrator does not edit the plan or the tests; the gate refuses such a change without the
founder's approval, and outside the story's scope. It names the drift, which requirement, which rows
bear on it and which stories are affected, and stops.

Before the first build has landed that is an upstream change under
[ORCHESTRATOR.md](ORCHESTRATOR.md) section 7, returning the preparation to the earliest invalidated
gate. After it, it is an increment: a packet to `eval/` and `docs/` the founder approves, then the
story (INCREMENT.md sections 3 to 7).
Between the two merges main's tests fail by design and every other pull request is refused, the red
window of INCREMENT.md section 6. The test lands before the code, every time.

## 8. What the build orchestrator refuses

It says which rule applies, what it did not do, and what the founder can do next:

- Run `approve`, `repair` or `protect`, or set `pod/approval` any other way. Only this rule
  stops it.
- Merge a pull request, or arm auto-merge other than through `build` and `fix`.
- Treat a handoff, a builder's local run or any agent's claim as evidence.
- Report a story done without its merge in main's history.
- Change anything under `app/`, `eval/` or `docs/`, or push to a story branch.
- Widen a scope, or ask the founder to widen one so a candidate passes.
- Let a builder repair or write the tests that judge it.
- Start a second builder on a story in flight, or two stories whose scopes overlap.
- Override a reader's flag on its own judgement, or report a story sent back when `fix` did nothing.
- Rename, edit or delete a record in `.pod/runs/` to make a command work.
- Substitute another process for a blocked step. It reports the blocker and stops.
- Also act as the preparation orchestrator for the same project.

## 9. Known limits

- **Anyone with write access can set `pod/approval`.** The gate reads a commit status, not who set
  it: the founder's login, the orchestrator's session holding it, any agent in reach of it. Decision
  6 accepts this for version one; a GitHub App that alone may set the gate is the hardening path.
- **The runner's own token.** The gate's process holds a token that can write check runs, and runs
  the pull request's code in the same job, as the same user, with the token variables removed from
  that code's environment. Removed from its environment is not out of the machine's reach.
- **The reader sees only what it is handed**: the brief, main's Conventions section, the diff (cut
  at 200,000 bytes) and the handoff. It cannot run the code, open another file, read GitHub or
  check a registry. Clean means it found nothing in that text. It is a second agent, not an
  independent authority.
- **The gate tests the branch's `app/`, not the merge result**, and is not re-run when main moves.
- **A skipped row may pass.** Refusing a report with a skipped row is the runner's job, not yet in
  the template (`template/README.md`, finding 4).
- **`status` shows the gate only**: each story from the local `eval/stories/`, the pull request on
  `story/<n>` and its verdict; not the reader's findings, auto-merge, or a `--suffix` branch.
- This side checks that the standard set in preparation is the standard applied. It cannot say the
  standard was right. Passing rows and a clean reading make a story accepted, not good; the
  founder's walk of the merged application (INCREMENT.md section 8) is the check on that.

## 10. The commands, exactly

None replaces reading its output: each names what it stopped on, and that text is what gets
reported. Until the package is published, `pod-works` is `npm link`ed from `cli/`, or run as
`node <path to pod-works>/cli/dist/cli.js`, always from inside the founder's repository.

**The orchestrator's:**

```
pod-works doctor            reads the machine, the repository and main's protection; writes nothing
pod-works build <n> [--agent claude|codex] [--model <id>] [--max-turns <n>]
                    [--brief <file>] [--suffix <name>] [--no-auto-merge]
                            worktree, builder, push, pull request, reader, auto-merge if clean;
                            writes .pod/runs/story-<n>-<time>.json (Codex adds .codex.jsonl and
                            .codex.last.md) and .pod/runs/story-<n>-review-<ms>.json;
                            --no-auto-merge also skips the reader; --brief, --suffix: rehearsals
pod-works wait <pr>         until judged and merged, or twenty minutes; writes nothing;
                            exit 0 when merged or green
pod-works review <n> [--branch <ref>]
                            the reader alone; writes .pod/runs/story-<n>-review-<ms>.json and
                            comments on a block; never arms auto-merge; exit 1 when flagged
pod-works fix <n>           resumes the builder with the gate's refusal, or with the reader's
                            block findings on a green gate; then as build
pod-works preview <pr>      a pull request's own eval/ against main's app/ on GitHub's runner;
                            sets pod/preview on the head (the gate ignores it) and writes
                            .pod/runs/preview-<pr>-<ms>.json
pod-works packet start <n> <name>
                            worktree .pod/worktrees/packet-<n> on a new branch eval/<name> from
                            origin/main; refuses if story <n> is on main or either exists
pod-works packet rehearse <n> [--with-app <dir>]
                            runs "baseline" (main's eval/ on main's app/ as gate.sh shapes it,
                            all green), "packet" (the packet's committed eval/ and docs/ on main's
                            app/ as preview.sh shapes it, failing exactly the .expect ids, no row
                            of main's missing unless retired) and, with --with-app, "throwaway
                            fix" (all green, not evidence), with credentials stripped; writes
                            .pod/runs/packet-<n>-rehearsal-<ts>.json; exit 0 only if every run
                            was as expected; leaves <dir> for the founder to delete
pod-works review --packet <n>
                            a fresh reader over the packet's committed diff, brief, .expect and
                            main's rubrics; writes .pod/runs/packet-<n>-review-<ts>.json; exit 1
                            on a block; refuses a dirty worktree
pod-works packet open <n>   refuses without an as-expected rehearsal of the head and current main
                            (with the throwaway-fix run whenever rows fail against main) and a
                            review of both, or on any block on the head; pushes that commit,
                            opens or updates the pull request with the check and the labelled
                            rehearsal in its body, runs preview, returns its code
pod-works status            what waits on you, then every story, its pull request and gate verdict; writes nothing
/pod-works-qa <n|all>       the QA pass on the merged main; writes .pod/runs/qa-<n|all>-<ts>/
                            (drafts, decisions.md, summary.json); stops once for the founder
```

**The founder's:**

```
pod-works approve <pr>      sets pod/approval on the head commit and arms auto-merge
pod-works repair            pushes main with administrator enforcement lifted for that one push
pod-works up [--port <n>]   the approval console on 127.0.0.1: approve, merge anyway, send back,
                            defect decisions, acceptance
```

**Reads, for the facts the verdicts are about:**

```
gh pr view <pr> --json number,state,headRefName,headRefOid,autoMergeRequest,mergedAt,url
gh pr view <pr> --comments                        # the reader's findings, when it flagged
gh pr list --head story/<n> --state all --json number,state,headRefOid,url
gh api 'repos/<owner>/<repo>/commits/<sha>/check-runs?check_name=pod-gate'
gh api repos/<owner>/<repo>/commits/<sha>/status  # pod/approval and pod/preview
gh api repos/<owner>/<repo>/branches/main/protection/enforce_admins
git fetch origin main && git log --oneline origin/main
git show origin/main:eval/stories/<n>.txt         # the scope the gate will read
git -C .pod/worktrees/story-<n> status --short    # what a builder left uncommitted
```
