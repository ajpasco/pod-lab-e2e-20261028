# Increments: changing an application after it is built

[ORCHESTRATOR.md](ORCHESTRATOR.md) turns an idea into a contract and its acceptance tests: the tests
written from the requirements before the build and locked so the builders cannot change them.
[BUILD.md](BUILD.md) builds the stories those tests judge. This file covers what happens once that
first build has landed and the founder wants something more, something different, or something gone.
It is the step that decides whether this is a method or a one-shot tool.

An increment is a new feature, a changed behaviour, or a removed one. All three follow the same
route, and the route is short because the gate already enforces its order. Nothing here loosens a
rule from the other two documents; it only says which of them an increment re-runs, and how much.

## 1. What the gate already enforces

Three rules of `pod-gate`, the workflow that judges every pull request from main's copy of itself,
decide the shape of an increment:

- `eval/`, `docs/` and `.github/` are protected. A pull request that changes any of them needs the
  founder's approval, a commit status `pod/approval` on its exact head commit, which
  `pod-works approve <pr>` sets, arming auto-merge at the same time. A pull request that is not a
  story may change nothing else.
- A story branch `story/<n>` may change only what `eval/stories/<n>.txt` on main allows, plus its
  own handoff note.
- Every pull request is judged by main's whole set of acceptance tests, run against that pull
  request's `app/`.

Three consequences follow, and they are the point:

1. **The test and the code cannot land in one pull request.** A story may not touch the acceptance
   tests; a non-story may not touch the application. The standard is set first, every time.
2. **The contract changes only by the founder's hand.** No agent can widen the PRD, soften a row
   or grant itself a file.
3. **An increment cannot break an earlier feature unnoticed.** Every old row still runs.

## 2. What counts as an increment

- **An addition.** New criteria, new rows, a story that creates files or extends existing ones.
- **A change.** Criteria revised, rows revised, a story that alters behaviour already built.
- **A removal.** Criteria marked removed, rows retired, restraint rows added that assert the
  control, route or stored data is gone, and a story whose scope is the files that lose code.
- **A technical change with no behaviour change**, a library swap or a restructuring. The acceptance
  tests observe the application from outside its process, so the rows do not move. It is still a
  story, and a story needs a brief and a scope file under `eval/stories/`, so it still arrives as
  a packet the founder approves. The packet is those two files, with an empty `.expect` or none
  (section 3), since no row should fail.
- **A defect the acceptance tests missed.** If the application does something wrong and every row
  passes, a row is missing. That is an increment: the row first, then the fix story. A defect the
  acceptance tests catch cannot be on main; the gate refused it.

Not an increment: a change before the first build starts. That is an upstream change under
ORCHESTRATOR.md section 7, which returns the preparation to the earliest invalidated gate.

**What an increment costs depends on what it touches.** Internals are cheap: the acceptance tests do
not see them. The contract is expensive: the blueprint's section 12 pins the routes, the request and
response shapes, the locators and the on-screen strings, and every row that reads one of them is
rewritten when it changes. The orchestrator says which kind a request is before the founder
commits to it.

## 3. The packet

One pull request on a branch named for the change, `eval/<name>`, changing nothing outside `docs/`
and `eval/`. A change to `app/` is a story's; a change to the gate (`.github/`) or to the
dependency files (`package.json`, `package-lock.json`) is its own pull request, never part of a
packet.
`pod-works packet start <n> <name>` makes its working copy: a git worktree at
`.pod/worktrees/packet-<n>` on a new branch `eval/<name>`, cut from `origin/main`. It refuses when
story `<n>` is already on main, or when the branch exists. An earlier packet's worktree at that
path is removed, with its branch, when it is clean and everything it changed is on main; one with
uncommitted or unmerged work is refused, naming `git worktree remove --force` to discard it.

**A packet with no story.** Some packets have nothing to build: one that only defers a defect
(its record, its row and the `eval/deferred.txt` line), one that only carries "not a defect"
records, and a plan correction that changes no row. Such a packet has none of
`eval/stories/<n>.md`, `.txt` and `.expect`, and every row must pass against main's `app/`, apart
from the rows its `eval/deferred.txt` defers; it is rehearsed, read and opened as any other, and
its pull request says "no story: nothing to build". Some of the three and not the others is a
half-written story, which the packet commands refuse. It still takes the number `<n>`, for its
worktree and its records, and leaves nothing under `eval/stories/` on main, so the next packet
takes the same number; its old records cannot be mistaken for the new packet's, because
`pod-works packet open` matches records by head commit and main commit.

The build orchestrator runs the increment through the `/pod-works-increment` skill (section 10)
and writes none of the packet. It asks the founder's question, if there is one, and hands the
answer, in the founder's words, to a `packet-drafter` subagent (`.claude/agents/packet-drafter.md`),
which writes the six parts below in that worktree and commits them on `eval/<name>`. The drafter
never pushes, never opens the pull request and is not the reader of its own packet.

1. **The PRD amendment**, in `docs/PRD.md`. Numbered, dated, and naming who decided. A new
   criterion gets a new id. A changed criterion keeps its id and records the revision. A removed
   criterion is marked removed and never deleted. An id is never reused. A behaviour the founder
   chose for a defect because the PRD was silent (section 9) enters here as a criterion, in the
   founder's words.
2. **The blueprint delta**, in `docs/TECH-SPEC.md`. Which layer the change lands in; which lines of
   the pinned contract change; a verification register row for every new or changed criterion
   naming the mechanism and the evidence; every technical choice the build needs; who decided
   each one. When the change needs a convention the Conventions section does not state, or
   changes a production-readiness decision, the delta says so, with who decided, and the
   conventions step under `eval/` gains or changes its tool in the same packet
   ([PRACTICES.md](PRACTICES.md)).
3. **The eval plan delta**, in `docs/eval-plan.md`. New rows, positive and negative, traced to
   their criterion and back; a restraint row wherever a surface gains or loses a control; changed
   rows revised in place with the revision recorded; retired rows listed by id; and for every new
   or changed row, its expected state against the current main, which the `.expect` of item 6
   records.
4. **The rows as code**, under `eval/`, and the expected-id lists the runner reads updated to
   match, so that a missing or skipped row fails the acceptance tests. A later story's rows exist
   in the eval plan as rows, not as code, until that story's packet: the drafter writes the code
   from the plan's row and its stated expected state when the packet opens. Nothing is stashed
   meanwhile.
5. **The story brief and scope**, `eval/stories/<n>.md` and `eval/stories/<n>.txt`, for a packet
   with a story. The number
   continues the sequence. The scope may include files an earlier story owned; the disjoint-scope
   rule of the blueprint's section 9 is for stories built in parallel, not for increments in
   sequence. The brief follows the shape the earlier briefs set: what exists and is not the
   builder's, the files it owns, the contract sections pinned, the acceptance tests and how to run
   them, the row ids it is graded on, and what done means.
6. **The expectations file**, `eval/stories/<n>.expect`: optional, and a missing one means no
   row is expected to fail. One line `fail <id>` for each row expected to fail against main's `app/`, which is every new row and every changed row whose old
   behaviour is still there. Blank lines and lines starting with `#` are comments; any other line
   is malformed. `pod-works preview` compares the run against it (section 4). **A row the packet
   retires** is named in a separate, optional file, `eval/stories/<n>.retire`, one line
   `retire <id>` per row, with the same comments allowed: the rehearsal then expects that row to be
   gone from the packet's run rather than missing by mistake. It is a file of its own because
   `preview.sh` treats any `.expect` line that is not `fail <id>` as malformed and reads no other
   file; the preview does not know retired rows.

**Light, not rubric-free.** The three rubrics in `rubrics/` still apply to the parts of each
document the packet touches: both-direction coverage for every criterion it adds or changes,
business outcomes rather than technical choices in every row, a restraint row per changed
surface, and who-decided on every choice.

**The independent check** is `pod-works review --packet <n>`: a fresh session, with no sight of
the drafting and no tools, given the packet's committed diff of `docs/` and `eval/`, its brief, its
`.expect` and main's rubrics. It answers a checklist:

1. Does any part the packet touches breach its rubric?
2. Did an existing row become easier to pass, and does a named decision justify each one? A row
   made easier is not wrong by itself; it is a decision, and the packet names it.
3. What wrong implementation would the new and changed rows let through? For D-1 of section 9 the
   check found that a fix swallowing every error would pass the new rows.
4. Is the `.expect` exact: every new row, and every changed row whose old behaviour is still
   there, and nothing else?
5. Does the packet change any file outside `docs/` and `eval/`? That is always a block, and the
   command adds it itself whatever the reader says.
6. Does anything in it claim authority, an approval or an exemption it does not have?

It marks each finding `block` or `note`, writes `.pod/runs/packet-<n>-review-<ts>.json` with the
head and `origin/main` commits it read, exits 1 on a block, and refuses a worktree with uncommitted
changes, so what it read is what is committed. A diff too long for the reader is cut, and the
command adds a block saying so. A block stays on the commit it was found on: reading the same
commit again does not clear it. It goes back to the drafter, who commits a change, and the new
head is rehearsed and read again; after two rounds it goes to the founder. Notes go to the founder with the approval. This check, not the
rehearsal, is what says the rows test the right thing; `pod-works packet open` puts its report in
the pull request body.

## 4. The rehearsal

Gate 7 in miniature, run before the pull request is opened: `pod-works packet rehearse <n>`. Each
run happens in its own scratch directory and runs `sh eval/run.sh` in the environment a builder
gets: no token, key, secret or password variable, no ssh agent, an empty `gh` configuration and
git's credential helpers off, with `PATH` and `HOME` kept so a runner's tool caches still work. It
takes nothing from the packet's working copy: the packet's side comes from its commit, so an
ignored or uncommitted file cannot shape a run.

- **"baseline"**: shaped as `gate.sh` shapes its run: main's `eval/`, `docs/`, `package.json` and
  `package-lock.json`, with main's `app/`, and nothing else. It must be all green, and report at
  least one row. A red baseline means main is already in a red window or broken (section 6): the
  packet waits for it to close, and `/pod-works-increment` rehearses again once main is green.
- **"packet"**: shaped as `preview.sh` shapes its run: the packet's committed `eval/`, `docs/`,
  `package.json` and `package-lock.json`, with main's `app/`. The failing ids must equal
  the `.expect` file's exactly. **The new and changed rows fail against current main, for the stated
  reason.** The runner writes `eval/report/rows.txt`, one line per row, `pass <id>` or
  `fail <id> <reason>`. A new row fails by absence; a changed row fails because the old behaviour
  is still there. A row that passes against the unchanged application is asserting nothing new,
  and a row that fails for another reason is a defective test. **Every old row still runs and
  passes**, unless the packet retires it in `eval/stories/<n>.retire`: an id the baseline
  reported, passing or failing, that this run does not report makes it not as expected, and the
  record names the ids. The command compares ids, not reasons: the orchestrator reads each reason
  itself.
- **"throwaway fix"**, with `--with-app <dir>`: the packet run's shape with `<dir>` as `app/`. It
  must be all green, with every row of the baseline's reported here too unless retired: **the
  rows are satisfiable.** The drafter writes `<dir>` in a temporary directory outside the
  repository, a copy of main's `app/` with a fix in it, and leaves it there for this run; it is
  never committed. Neither pod-works nor the headless orchestrator deletes it (the orchestrator's
  allowlist has no `rm`); the command says where it is, and the founder deletes it. The run is
  labelled not evidence. It proves the rows can pass, not that they test the
  right thing: the session that wrote the rows wrote the fix, and a fix that passes them may still
  be wrong, as section 3's check showed for D-1.

A run stopped by a signal is never as expected, and neither is one that exits 0 with an empty rows
file. It writes `.pod/runs/packet-<n>-rehearsal-<ts>.json`, with the head and `origin/main`
commits it ran, and exits 0 only when every run came out as expected. It refuses a packet that
changes anything outside `docs/` and `eval/`, committed or not, whose story is half-written (a
brief without a scope, or the reverse), or whose `.expect` or `.retire` is malformed. A listed
row of `eval/deferred.txt` that passes gets the gate's note: its defect may be fixed.
The orchestrator reads the record itself, not the drafter's account of it. On a failure the
drafter gets the exact output back, at most twice, and then the founder hears of it.

Once the pull request is open, the same run on GitHub's runner is `pod-works preview <pr>`. It runs
the pull request's own `eval/` and `docs/` against main's `app/` on GitHub's runner, in the shape
the gate will run them in after the merge (decision 21: the gate takes main's `eval/` and `docs/`,
the preview the pull request's). A row that passes on a laptop and breaks on the runner is found
before the merge rather than by the next pull request, whose recovery is `pod-works repair`. It
proves the first and third points again where it matters. It prints the failing rows, each with
its reason, and compares them with the packet's `eval/stories/<n>.expect`: when exactly those rows
fail, it reports "as expected" and records a `success` `pod/preview` status on the head commit,
set with the founder's login. Any other set, a listed row passing or an unlisted row failing, is
not "as expected". The gate does not read the status.

`pod-works packet open <n>` writes the evidence into the pull request body, under these headings:
a summary; "Independent check", the reader's report; "Rehearsal (not evidence)", the commands,
exit codes, failing rows and row counts of each local run, the throwaway fix's among them, so
nobody reads them as the proof; "Not rehearsed", what could not be; and "The founder's act". It
refuses a worktree with uncommitted changes, a packet whose commits change anything outside
`docs/` and `eval/`, a head with no as-expected rehearsal record (one with the throwaway fix run,
whenever rows fail against main) or no review record, any review of that head with a block, and
records of another main ("main moved; rehearse and review again"). Then it pushes that exact
commit to the branch (`git push origin <head>:refs/heads/eval/<name>`), opens or updates the pull
request, titled `eval: <the brief's heading>`, runs `pod-works preview <pr>` and exits with the
preview's code. The reader's findings and the runner's words go into the body as code, so an
`@name` in them notifies nobody.

## 5. The founder's approval

The gate judges the packet with main's current acceptance tests against the unchanged application,
finds the scope correct for a non-story pull request, and reports "waiting for the founder", naming
the head commit. That is the gate working.

The orchestrator reads the preview's verdict itself, from the `pod/preview` status on the head
(`gh pr checks <pr>`, or the preview's record `.pod/runs/preview-<pr>-<ms>.json`; `pod-works
status` shows the status's description at its top), and prepares the approval, stated before the command is typed:
the pull request and its head commit; the exact command, `pod-works approve <pr>`; what the gate
says now and will say after it, the approval found on that commit and main's acceptance tests
passing, then the merge with no second act; what the founder is agreeing to; the reader's notes;
every choice the drafter recorded as a default rather than a founder's decision; and what was not
rehearsed. Then it stops. It never runs the command.

The founder reads the amendment, the diff of the rows, the brief and the report of section 3's
independent check, and the rows the preview names as failing, their reasons, and its verdict.
"As expected" says the right rows failed; the reasons say whether they failed for the right
reason. Any other verdict is a question the orchestrator answers before the founder approves. The
approval rests on the independent check and the preview, not on the rehearsal. Then the founder
runs `pod-works approve <pr>`, which sets `pod/approval` on that commit and arms auto-merge. The
`status` trigger re-judges the pull request and, green, it merges with no second act. A new push is
a new commit with no status, so nothing stays approved after it changes.

What the founder is approving is the contract and the standard the builder will be judged by.
This is the increment's one human moment before the build, and it is the whole of the founder's
authority over what gets built.

When the founder says it is approved, the orchestrator does not take the word for it: it reads
`pod/approval` on the exact head commit, runs `pod-works wait <pr>` and confirms the merge in
main's history from GitHub, then starts the story at once (section 7).

## 6. The red window

From the moment the packet merges until the story that satisfies it merges, main's acceptance tests
fail against main's own application. The new rows fail by design. In that window the gate refuses
every other pull request, including an eval-only correction, because main's acceptance tests are run
against the unchanged application and fail. This is the lab's finding, and it is the price of
landing the test before the code.

Rules for living with it:

- **One increment open on GitHub at a time.** `/pod-works-increment` starts beside an increment
  in flight: it says which one is open and that main may be red, drafts, rehearses and has the
  packet read in its own worktree, and waits only before `pod-works packet open`, saying "waiting
  for story <n> to merge" and running `pod-works wait <pr>`. The baseline rehearsal needs main
  green, so it waits there too while a red window is open. Start the story as soon as the packet
  merges: the orchestrator waits for the merge and starts it in the same session (BUILD.md
  section 2, step 0).
- **Keep the packet and the story close in time.** A packet approved on Friday for a story on
  Monday leaves main refusing everything over the weekend.
- **If the packet itself is wrong**, a harness defect rather than a failing row, the recovery is
  `pod-works repair`: it pushes main with administrator enforcement lifted for that one push and
  binds it again on exit, and GitHub logs both. It is the founder's act, and the pull request it
  pushes is still the founder's to read.

The alternative, landing the amended test and its implementation together, is exactly what the
gate refuses, and section 1 says why. BUILD.md section 7 says the same from the build side: the
test lands before the code, every time, and the window is the design, not a gap.

## 7. The build

The orchestrator that opened the packet runs the story in the same session, as BUILD.md section 2
says, and stops again only when the story itself needs the founder: a reader's block, or a scope
that would need a protected path.

`pod-works build <n>` starts a builder in its own worktree on `story/<n>`, confined to the scope,
pushes its commits, opens the pull request, and has a fresh reader (`pod-works review`) read the
diff against the brief and the handoff. Clean, and auto-merge is armed: the gate runs all the
acceptance tests and the story merges on green with nobody clicking. Flagged, and the merge waits
for a person with the findings on the pull request. `pod-works wait <pr>` watches;
`pod-works fix <n>` sends a refusal back to the same builder. BUILD.md governs the orchestrator's
conduct here without change: the handoff is a claim, the check run and the merge are the evidence,
and a test the builder believes wrong goes in its handoff and is never edited. The increment is
done when the story's merge is in main's history.

## 8. Acceptance

The gate proves the acceptance tests passed. The fresh reader proves nothing obviously foreign came
with it. Neither proves the founder got what they meant. The QA pass of section 9 runs first, on
the merged main, and its decision list reaches the founder before the walk. The founder walks the feature on the merged
main, as the earlier plan's review rows had a person do: `/pod-works-qa all` first, then an
agent's pre-review, in a session that did not build it, then the founder's own record, which is
the evidence. The agent's walk is not.

`/pod-works-accept [<commit>]` prepares it (`.claude/skills/pod-works-accept/SKILL.md`), on a
merge commit, main's head by default. It checks that the `pod-gate` check of the pull request
that made that commit passed, that no packet or story is open, and that a record of
`/pod-works-qa all` under `.pod/runs/qa-all-<ts>/` covers that commit: its `summary.json` names
the commit as `main`, or `git diff --name-only <its main> <commit>` touches nothing under `app/`,
nothing under `eval/` but `eval/deferred.txt`, and neither `package.json` nor
`package-lock.json`. The defect decisions land as records and a deferred list, which move main
without changing what QA tested. Otherwise it warns: "QA pass ran on <sha>, and app/ or the tests
changed since". `.pod/runs/` is local to one machine, so this check is only as good as the
machine it runs on, the founder's. It locks
nothing: a gap is named with the command that closes it, and if the founder goes on, the draft
lists it as a known limitation. The pre-review does not redo QA: an `acceptance-walker` subagent
(`.claude/agents/acceptance-walker.md`) turns QA's record and decision list and the merged stories
into a walkthrough script the founder can follow, one step per PRD criterion with what they
should see, with the open and deferred defects and the row counts of one run of the acceptance
tests. The skill writes it, under a draft of the note in the console's shape, to
`.pod/runs/acceptance-<date>-draft.md`, with the verdict left for the founder's words and a
suggested sentence marked as one. Then it says how to record it, and stops.

The founder walks it, then records the acceptance with the approval console (`pod-works up`):
its accept action writes a dated note, `docs/acceptance/<date>.md`, naming the merge commit walked
on, the founder's login, their verdict verbatim, every deferred defect and the other known
limitations they paste from the draft, on a branch
`docs/acceptance-<date>`, and opens the pull request. `docs/` is protected, so the founder approves
it with `pod-works approve <pr>`. Recording and approving are the founder's alone; the skill does
neither, and there is no `pod-works accept` command.

## 9. Defects: QA finds them, the founder decides which go in

QA is three things here: the rows, which run on every pull request; the release's one check,
that main's head holds the `app/` and `eval/` the founder accepted (`pod-works release`,
decision 23); and the QA pass, in which a session that did not build the feature drives the merged
application, looking for what the rows did not imagine (decision 20). Whichever finds a defect,
the same record and the same decision follow.

**The QA pass** is the `/pod-works-qa <n>` skill (section 10), or `/pod-works-qa all` for the whole
application. It runs as the last step of every `/pod-works-increment`, once its story has merged;
before the founder's acceptance of section 8, as `all`; and after an ordinary story only when the
founder asks. It confirms the story's merge from GitHub, records the main commit it runs on, and
unpacks that commit with `git archive` into a scratch directory outside the repository: a copy
with no `.git`, so nothing run in it can commit or push, which the founder deletes afterwards. A
fresh `qa-tester` subagent (`.claude/agents/qa-tester.md`), given the brief, the criterion labels,
the commit and that copy, and never the diff, the handoff or the build's record, checks every PRD
criterion the story was meant to fulfil: met, partly met or unmet, with the command, input, output
and exit code. A criterion unmet or met only in part is a defect even when every row passes. It
then drives the happy paths as the PRD describes them, the unhappy ones (bad and missing input,
empty and very large data, use out of order, closed pipes, signals and permissions), and hunts
for crashes, stack traces, lost data and messages that leak internals. Each finding comes back
with a draft record and a draft reproducing row. The orchestrator runs each reproduction again
itself; one it cannot reproduce is dropped, with a note. The rest get defect ids, continuing from
the highest `D-<k>` on main and in every earlier QA run. The drafts live in the run directory
`.pod/runs/qa-<n|all>-<ts>/`, beside `decisions.md`, the one decision list (the heads-up below),
and `summary.json`, the main commit, criteria counts and defects that the acceptance reads. QA
starts no fix and writes nothing under `app/`, `eval/` or `docs/`.

**A defect record** is one file per defect, `docs/defects/D-<n>.md`, under a protected path. It
holds what was seen (the steps and the actual outcome); what the PRD requires, by criterion
label; the behaviour to decide (a line `Behaviour to decide:` holding the options, a
recommendation and the founder's choice in words, or `none: the PRD already says`); the row that
reproduces it, an existing row's id or the new row's id once written; a severity in the
founder's terms (wrong data, wrong refusal, wrong look, cosmetic); who found it and when; and the
founder's decision with its date: fix now, deferred, or not a defect, with the reason. A defect
without a row is a report, not a defect. The row is the reproduction, and writing it is the
first act once the right behaviour is known.

**The heads-up.** Whoever writes the records never opens a story for them. They come to the
founder as one list, in one stop, each with a severity, a recommendation (fix now, or defer) and
its cost: the files the fix touches, and whether the contract of blueprint section 12 moves; and,
where the PRD is silent, the behaviours to choose between and the one recommended. It is the same
shape as a gate-6 decision list. The founder decides in words, per defect, or takes the
recommendations whole. Nothing enters the pipeline on a session's own judgement.

**How a draft reaches main.** A record is under `docs/`, a protected path, so it reaches main only
inside a packet the founder approves, as D-1's did. A defect decided "fix now" or "deferred" is
`/pod-works-increment D-<k>`, which reads the newest `.pod/runs/qa-*/D-<k>.md`; its packet-drafter
copies the record into `docs/defects/D-<k>.md` with the founder's decision on its `Decision:`
line, and the row draft into `eval/`. A deferred one's packet also lists the row in
`eval/deferred.txt`, as the paragraph below says; it is a packet with no story (section 3), with
no story files, and builds nothing.

**When the PRD is silent, the founder chooses the behaviour.** A defect is wrong only against a
requirement, and sometimes none says what right is. In the first increment run this way, on a
small command-line tool, D-1 was a stack trace from `list | head -1`, and the PRD said nothing about a reader that closes the pipe: a
silent exit 0, one error line and exit 1, and exit 141 were each defensible. The founder chooses
before the row is written, since a row written first would choose for them. The choice goes on
the record's `Behaviour to decide:` line and becomes a PRD criterion in the packet (section 3,
item 1), which the row traces to.

**Put in.** A defect the founder says to fix is the increment of section 2: the behaviour chosen,
if the PRD was silent, is a criterion in the PRD amendment; its row is active in the
acceptance tests, the packet carries the row and a story whose scope is the files the fix touches,
the founder approves, the red window opens, the story lands, the row passes and stays.

**Deferred.** A failing row on main blocks every pull request, so a deferred defect cannot have its
row active. The row stays in the acceptance tests' files and runs on every pull request, but its id
is listed in `eval/deferred.txt` beside its defect id, one `<row id> D-<k>` per line, and the row
check reports it without failing the acceptance tests. The runner does this, not the gate, which
knows no stack: it leaves the listed rows out of the run whose exit status is the verdict, by
name, then runs them alone for the report, its exit status ignored. A listed row that fails is
written `deferred <id> D-<k> <reason>` in the rows file; a listed row that never ran, or is
skipped, still fails the run. The report can add a failure to the verdict, never remove one. The gate,
the preview and `pod-works packet rehearse` list deferred rows apart from the failing ones, and all
three note a listed row that passes. The sample runner does it; a project on another stack does it in
its own `eval/run.sh` (RUNTIMES.md). The plan check counts a deferred row as a row with a test. That
list is the backlog and the known-limitations list in one place, under `eval/`, a protected path,
so only a pull request the founder approved changes it. The gate runs main's list for every story;
the preview runs the pull request's list for a packet, so a packet's `.expect` that names a row the
list defers is not as expected, because that row did not fail. Fixing a deferred defect later is
the packet above plus one line removed from the list. The acceptance record of section 8 names
every deferred defect.

**Not a defect.** Recorded with the reason and closed. A QA draft decided so gets no pull
request of its own: its record, with `Row: none`, rides in the next packet opened, and waits in
its run directory until then. Its draft row was never committed, so nothing is retired; a row
already on main is retired under the plan's rule that an id is never reused.

## 10. The commands, exactly

**The skill.** `/pod-works-increment D-<n>` (a defect recorded in `docs/defects/D-<n>.md`) or
`/pod-works-increment "<a short feature description>"` runs one increment from the founder's
question to the story's merge, as the build orchestrator, and stops once for the approval
(`.claude/skills/pod-works-increment/SKILL.md`). Headless, the founder's question and the approval
each end the run; the founder answers, or says it is approved, with `claude -p --resume
<session id> "<their words>"`. The headless run, as story 2's build ran, with the packet commands
and the drafter added and still no `approve`, `repair`, `protect` or `release`:

```
claude -p "/pod-works-increment D-<n>" --output-format json --permission-mode acceptEdits \
  --max-turns 120 --add-dir "${TMPDIR:-/tmp}" \
  --allowedTools "Read,Glob,Grep,Write,Edit,Agent,Bash(pod-works packet:*),Bash(pod-works build:*),Bash(pod-works wait:*),Bash(pod-works review:*),Bash(pod-works fix:*),Bash(pod-works preview:*),Bash(pod-works status:*),Bash(pod-works doctor:*),Bash(git:*),Bash(gh pr list:*),Bash(gh pr view:*),Bash(gh pr checks:*),Bash(ls:*),Bash(cat:*),Bash(cp:*),Bash(mkdir:*),Bash(sh eval/run.sh:*)" \
  < /dev/null
```

`--add-dir` lets the drafter write its throwaway fix outside the repository; `cp` and `mkdir`
make it. There is no `rm`: a prefix rule such as `Bash(rm -rf /tmp/pod-packet-:*)` would also
match `rm -rf /tmp/pod-packet-x /anything-else` and a path that climbs out with `..`, so the
founder deletes the throwaway directory, which `pod-works packet rehearse` names. `gh` is allowed
only in the three read-only forms the skill uses: `gh pr list` for the in-flight check, `gh pr
view` for a pull request's state and comments, and `gh pr checks` for the `pod-gate` check run and
the `pod/preview` and `pod/approval` statuses on the head. `gh api` is not allowed, because a
prefix rule cannot tell its reads from its writes; the reads BUILD.md lists through `gh api` go
through `gh pr checks` and `pod-works wait` instead, and the branch-protection read through
`pod-works doctor`.

**The QA skill.** `/pod-works-qa <n>` or `/pod-works-qa all` runs the QA pass of section 9 and stops
once, for the founder's decisions (`.claude/skills/pod-works-qa/SKILL.md`). The `qa-tester` it
spawns must run the application, so the session needs the application's commands, chosen from
`eval/runtime` (`node 22`: `node`, `npm`, `npx`; `python 3.12`: `python3`, `pip`), and the tools
that drive it. Headless, the QA additions are:

```
Bash(tar:*),Bash(cd:*),Bash(head:*),Bash(tail:*),Bash(printf:*),Bash(echo:*),Bash(yes:*),Bash(seq:*),Bash(wc:*),Bash(grep:*),Bash(diff:*),Bash(chmod:*),Bash(kill:*),Bash(sleep:*),Bash(curl:*),Bash(sh eval/run.sh:*)
```

plus the runtime's, such as `Bash(node:*),Bash(npm:*),Bash(npx:*)`. Added to the increment's
allowlist above, they let `/pod-works-increment` run QA as its last step; without them it reports
the story merged and stops there. On its own, after a story or before acceptance:

```
claude -p "/pod-works-qa <n>" --output-format json --permission-mode acceptEdits \
  --max-turns 150 --add-dir "${TMPDIR:-/tmp}" \
  --allowedTools "Read,Glob,Grep,Write,Agent,Bash(git:*),Bash(gh pr list:*),Bash(pod-works doctor:*),Bash(ls:*),Bash(cat:*),Bash(cp:*),Bash(mkdir:*),<the QA additions>,<the runtime's>" \
  < /dev/null
```

`--add-dir` lets the tester work in the scratch directory, which the founder deletes. The
founder's decisions resume it, as the approval does: `claude -p --resume <session id> "<their
words>"`.

| Step | Command | What it does |
|---|---|---|
| Start the packet | `pod-works packet start <n> <name>` | worktree `.pod/worktrees/packet-<n>` on a new branch `eval/<name>` from `origin/main`; refuses if story `<n>` is on main or the branch exists; removes an earlier packet's clean, merged worktree at that path and refuses one with work in it |
| Rehearse it | `pod-works packet rehearse <n> [--with-app <dir>]` | the runs "baseline" (`gate.sh`'s shape), "packet" (`preview.sh`'s shape, from the commit) and, with `--with-app`, "throwaway fix", with credentials stripped from the environment; writes `.pod/runs/packet-<n>-rehearsal-<ts>.json` with the head and main commits; exit 0 only if every run was as expected and every row of main's ran or is retired; refuses a packet changing anything outside `docs/` and `eval/`, with a half-written story or a malformed `.expect`; a packet with no story files must be all green but its deferred rows; leaves `<dir>` for the founder to delete |
| Check it | `pod-works review --packet <n>` | a fresh reader with no tools over the committed diff, the brief, the `.expect` and main's rubrics (section 3); writes `.pod/runs/packet-<n>-review-<ts>.json` with the head and main commits; exit 1 on a block; refuses a dirty worktree |
| Open it | `pod-works packet open <n>` | refuses if dirty, if its commits change anything outside `docs/` and `eval/`, without an as-expected rehearsal (with the throwaway fix run when rows fail against main) and a review of the current head and current main, or on any block on that head; pushes that commit, opens or updates the pull request `eval: <brief heading>` with the check and the labelled rehearsal in its body, runs the preview and returns its exit code |
| Preview it on the runner | `pod-works preview <pr>` | runs the pull request's own acceptance tests against main's `app/` on GitHub's runner; prints the failing rows from `eval/report/rows.txt`; says "as expected" when exactly the `.expect` rows fail; records `pod/preview` on the head, information only |
| Approve it | `pod-works approve <pr>` | the founder's alone: sets `pod/approval` on the head commit and arms auto-merge; the gate re-judges and it merges on green |
| Build the story | `pod-works build <n>` | worktree, builder, push, pull request, fresh reader, auto-merge if clean |
| Watch | `pod-works wait <pr>` | until the gate has judged and, if it may, merged |
| Send a refusal back | `pod-works fix <n>` | the same builder session tries again inside its scope |
| See everything | `pod-works status` | first what waits on you, each with its command (a pull request to approve, a packet with its preview's verdict, a QA decision list not yet decided, an acceptance draft not yet recorded, an accepted head with no release), or "nothing waits on you"; then every story, what it has, what it waits on |
| Release the accepted application | `pod-works release <version>` | refuses unless an acceptance note on main names a commit with the head's `app/` and `eval/`; warns on the rest; tags the head and publishes a GitHub release with notes from the note, the stories since the last release and `eval/deferred.txt`; deploys nothing; founder only |
| Recover broken acceptance tests on main | `pod-works repair` | one push with administrator enforcement lifted and re-bound; founder only |
| Prepare the acceptance | `/pod-works-accept [<commit>]` | checks main's `pod-gate` and a QA `all` record for the commit (warns and records a gap, never locks); a fresh `acceptance-walker` turns QA's record into a walkthrough script with row counts and defects; writes the draft note to `.pod/runs/acceptance-<date>-draft.md`; the founder records it in `pod-works up` and approves it with `pod-works approve <pr>` |
| QA the merged application | `/pod-works-qa <n>` or `/pod-works-qa all` | confirms the merge from GitHub, unpacks main's commit with `git archive` outside the repository, has a fresh `qa-tester` check every criterion and the happy and unhappy paths, reproduces each finding, and writes `.pod/runs/qa-<n|all>-<ts>/` with the drafts, `decisions.md` and `summary.json`; stops once for the founder's decisions; starts no fix |

## 11. Known limits

- **The packet reader is a second agent, not an authority.** `pod-works review --packet` reads
  what it is handed, as the story reader does, and its clean report means it found nothing there.
  The founder is still the last line against a row quietly made easier, or one a wrong fix would
  pass. `pod-works packet open` refuses without its record, but nothing stops a pull request to
  `eval/` opened another way.
- **The rehearsal compares ids, not reasons.** A row failing for the wrong reason is as expected
  to `packet rehearse`; the orchestrator reads the reasons.
- **The gate and the preview run the same shape, from different sides.** Both copy `eval/`,
  `docs/`, `package.json` and `package-lock.json` beside an `app/` (decision 21): the gate takes
  them from main, the preview from the pull request. The rehearsal's baseline has the gate's shape
  and its packet run the preview's. Neither copies anything else from the repository, so a runner
  that reads another top-level file fails in all three.
- **The preview does not see a retired row, or any row that stopped running.** It compares only
  failing ids with the `.expect`, so a row the packet retires, or drops by mistake, is in neither
  list and the preview still says "as expected". Only the rehearsal compares the packet's rows
  with the baseline's, reading `eval/stories/<n>.retire`. `preview.sh` reads no such file, and a
  `retire` line put in an `.expect` would make the preview call that file malformed.
- **The headless session can do more than its rules allow.** The allowlist of section 10 narrows
  `gh` to reads and leaves out `pod-works approve`, `repair`, `protect` and `release`, but the
  session still holds: `git` with the founder's login, so it can push to any branch, delete one,
  force-push, or push a tag; `Write` and `Edit` on any file in the repository and in the temporary directory, `app/`,
  `eval/`, `docs/` and `.github/` included; and the plain-file records under `.pod/runs/`, which
  `pod-works packet open` trusts and which it can write, delete or forge. The rules say it does
  none of these. The rules are not the enforcement; the gate is: main's acceptance tests against
  the pull request's `app/`, the scope file, the protected paths and the founder's
  `pod/approval` on the exact commit.
- **One increment open on GitHub at a time is the skill's rule.** `/pod-works-increment` drafts
  beside an increment in flight and waits only before `pod-works packet open`; nothing in the gate
  stops a second packet opening while one is in flight, and the gate refuses it only once the
  first has merged.
- **The QA pass is only as fresh as its tester's context.** The `qa-tester` never sees the diff
  or the handoff, but it reads the same repository and documents as the builder, and may be the
  same model, with the same blind spots. The orchestrator that reproduces its findings ran the
  build. A clean pass means it found nothing in what it tried, and its report lists what it did
  not try.
- **QA drives a command-line or HTTP application.** A user interface is driven through HTTP only;
  no browser or emulator is in this batch, so layout, scripts in the page and anything visual go
  unchecked, and the report says so.
- **QA's allowlist is intent, not a fence.** `node`, `npm` and `python3` run any code, so the
  session, holding the founder's login, can do anything the founder's user can. The skill's rules
  keep the tester in its scratch directory; nothing enforces them. What protects main is the same
  as ever: a record or row reaches it only in a packet the founder approves.
- **`.pod/runs/` is local to one machine.** The QA run, its drafts and `summary.json` exist only
  where it ran, and "QA ran on this commit" is as good as that machine's record. A draft decided
  but not yet in a packet is lost with the machine.
- **A packet with no story still takes a number.** Its worktree and records are
  `packet-<n>`, and the next packet reuses `<n>`; `pod-works status` lists stories by their scope
  files, so it shows nothing for a packet with no story.
- **Accept's QA check reads only the local `.pod/runs/`.** `/pod-works-accept` warns when no QA
  record covers the commit, and the draft lists the gap; nothing stops a recording made without
  it.
- **The red window** of section 6 is a real constraint once more than one person is working.
- **`pod-works preview` is information, not a condition.** Nothing stops an approval with no
  preview, or after one that was not "as expected"; the founder reading it is the check. "As
  expected" compares row ids, not reasons: a new row failing for the wrong reason still counts,
  so the founder reads the reasons it prints.
- **`pod-works defects` is not built.** The approval console (`pod-works up`) shows the records,
  each with its behaviour to decide, and the deferred list, and records the founder's
  decisions; `pod-works status` says only that a local QA run has defects to decide. The behaviour itself is chosen in the
  conversation and written on the record; the console shows it and records no choice.
- **`pod-works prepare` and `pod-works freeze` are not built, and there is no `pod-works accept`
  command.** The packet is drafted by the `packet-drafter` subagent that `/pod-works-increment`
  dispatches; `/pod-works-accept` prepares the acceptance, and the founder writes the record from
  the approval console.
- **The cascade of ORCHESTRATOR.md section 7 is not mechanically enforced** once the documents
  live under `docs/`. The gate requires the founder's approval of the change; it does not check
  that the evals were re-derived from it. The orchestrator's state file is the record.
- **The approval is the founder's own token setting a status.** Anyone with that token can set it,
  the founder included, which is the drift-level authority the decisions log accepts for version
  one. A GitHub App that alone may set the gate is the hardening path.
