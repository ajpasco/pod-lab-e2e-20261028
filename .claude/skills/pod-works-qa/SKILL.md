---
name: pod-works-qa
description: Run the QA pass on the merged application - a fresh qa-tester subagent drives a clean copy of main against every PRD criterion the story was meant to fulfil, then the happy and unhappy paths, then hunts for bugs; you reproduce each finding yourself, number the defects, and bring the founder one decision list, stopping once. Starts no fix. Use as the last step of every increment, before the founder's acceptance (all), or when the founder asks after a story. Takes a story number or all as its argument.
---

Act as the QA orchestrator for this session, and only that role.

**Read `docs/orchestrator/INCREMENT.md` sections 8 and 9 and follow them.** They, and decision 20
of `docs/DECISIONS.md`, are the authority for what QA checks and what becomes of a defect. This
file is the order you run them in.

The argument is a story number `<n>`, or `all` for the whole application before the founder's
acceptance. If none was given, ask which, that one question.

You write nothing under `app/`, `eval/` or `docs/`, and start no fix. Your files are the run
directory `.pod/runs/qa-<n|all>-<ts>/` (ignored by git, so local to this machine) and the
scratch directory. The founder reads one of them, `decisions.md`.

## 1. Start

1. Bring main up to date (`git checkout main && git pull --ff-only`). If that fails, say why and
   that the founder runs it, and stop: QA on a stale main proves nothing about main.
2. **Confirm the story merged, from GitHub**, never from a handoff or a note:
   `gh pr list --head story/<n> --state merged --json number,mergeCommit,mergedAt`, and the merge
   commit in main's history (`git merge-base --is-ancestor <merge sha> origin/main`). Not merged:
   say "story <n> has not merged; `pod-works wait <pr>` first, then `/pod-works-qa <n>`" and stop,
   since there is nothing on main to check. For `all`, list every story under `eval/stories/` on
   `origin/main` and its merge, and warn about any that has none, naming it, then go on.
3. Record the commit QA runs on, `git rev-parse origin/main`, and the timestamp `<ts>`. Make the run
   directory and the scratch directory `${TMPDIR:-/tmp}/pod-qa-<n|all>-<ts>/`, with `checkout/` and
   `work/` in it.
4. **The checkout**: `git archive <main sha> | tar -x -C <scratch>/checkout`. An archive, not a
   worktree, because it has no `.git` leading back to this repository: nothing run in it, the
   application, its install scripts or the tester, can commit, move a ref or push from there, and
   the repository gains no worktree to prune. It holds exactly the committed tree, nothing ignored
   or uncommitted. You have no `rm` headless, so you leave the scratch directory, and the founder
   deletes it; `decisions.md` names it. It is never in the repository.
5. **The criteria.** From the brief `eval/stories/<n>.md`, the rows it is graded on, and their trace
   in `docs/eval-plan.md` to criterion labels in `docs/PRD.md`: every criterion the story was meant
   to fulfil, removed ones left out. For `all`, every criterion in the PRD that is not removed.
6. **The commands the tester may run.** The application's own, from `eval/runtime` (`node 22`
   gives `node`, `npm` and `npx`; `python 3.12` gives `python3` and `pip`) and from the way the
   brief, or failing that `eval/run.sh`, starts the application; plus the driving tools that
   `.claude/agents/qa-tester.md` lists. Decide this from the records; do not ask the founder.
   Headless, the session's allowlist must hold them all (INCREMENT.md section 10); a command it
   lacks is refused and lands in the tester's "not tried".

## 2. The tester

**Spawn the `qa-tester` subagent** with the Agent tool. Give it: the scope; the brief's path; the
criterion labels; the main commit; the checkout `<scratch>/checkout`; its scratch directory
`<scratch>/work`; the run directory; and the commands of step 1.6. Nothing else: not the story's
diff, its handoff, the builder's run, the reader's findings or your own view of the build. Its
freshness is the point, and it lasts only as long as nothing from the build reaches its prompt.

## 3. Verification

Read its report, `report.md` in the run directory. For each finding `F-<j>`, run its
`Reproduce:` line yourself in the checkout and compare the exit code and the line it names.

- **Reproduced**: give it the next defect id and write `D-<k>.md` and `D-<k>.row.<ext>` in the run
  directory from the drafts, with the heading `# D-<k>: …`, and the `Found:` line ending
  "reproduced by the QA orchestrator, <date>". The record must parse as `cli/console/README.md`
  says: the heading and the seven lines, `Behaviour to decide:` as the eighth.
- **Not reproduced**: no id. It goes under "Dropped" in `decisions.md`, with what you ran and what
  came out.

**Numbering**: `D-<k>` continues from the highest of `docs/defects/D-*.md` on `origin/main`
(`git ls-tree --name-only origin/main docs/defects/`) and every `D-*.md` under `.pod/runs/qa-*/`.

A criterion the tester marked partly met or unmet with no finding behind it is a finding you
missed: send the tester back once, by SendMessage where you can, for its reproduction.

## 4. The decision list

Write `decisions.md` in the run directory, the one file the founder reads, in the shape of a
gate-6 decision list:

```markdown
# QA of story <n>, main <short sha>, <date>

Criteria: <x> met, <y> partly met, <z> unmet, <w> not checked (report.md has the table).
Rows: <pass> pass, <fail> fail. Checkout: <scratch>, which the founder deletes.

## D-<k>: <title>
- Severity: <wrong data | wrong refusal | wrong look | cosmetic>
- Recommendation: <fix now | defer>, and why in one line
- Cost: <the files the fix touches>; the contract of blueprint section 12 <moves: which lines | does not move>
- Behaviour to decide: <none: the PRD already says | the options, and the one recommended>
- Reproduced: `<command>` exits <code>: <the line>
- Founder's decision:

## Dropped
- F-<j>: <title>. Not reproduced: `<command>` exited <code>: <what came out>.
```

Then write `summary.json` beside it, for the tools, with exactly these field names
(`/pod-works-accept` reads it, and warns when `app/` or the tests changed on main since `main`):

```json
{
  "scope": "<n>" | "all",
  "main": "<full sha QA ran on>",
  "stories": [{ "n": 3, "pr": 12, "merge": "<full sha>" }],
  "startedAt": "<ISO time>",
  "finishedAt": "<ISO time>",
  "rows": { "pass": 0, "fail": 0 },
  "criteria": { "met": 0, "partlyMet": 0, "unmet": 0, "notChecked": 0 },
  "defects": [{ "id": "D-4", "severity": "wrong refusal", "recommendation": "fix now", "decision": null }],
  "dropped": 0
}
```

`decision` is `null` until the founder decides, then `"fix now"`, `"deferred"` or
`"not a defect"`. With no defects, say so in `decisions.md`, write the summary, and you are done.

## 5. The founder's one stop

Bring every defect in one message: the list above, each with its recommendation, and the
question: "Take my recommendations, or decide any of them differently?" The founder may answer
"take your recommendations", or name a defect and its decision; "not a defect" and "deferred"
need a reason in their words. Interactive, ask it once with AskUserQuestion. Headless, print it
and stop; the founder answers with `claude -p --resume <session id> "<their words>"`. Every other
question is yours to answer from the records and GitHub. Never treat silence as a decision.

On the answer: the founder's words under "Founder's decision" in `decisions.md`, the `Decision:`
line of each `D-<k>.md` (`fix now, <date>, <login>`, `deferred, <date>, <login>, <reason>` or
`not a defect, <date>, <login>, <reason>`, with the login `pod-works doctor` prints on its
`gh login` line), and `decision` in `summary.json`.

## 6. What becomes of each defect

You start none of it. Say the next command for each:

- **Fix now**: `/pod-works-increment D-<k>`, one at a time. Its packet carries the record into
  `docs/defects/D-<k>.md`, the row, and the story that fixes it.
- **Deferred**: `/pod-works-increment D-<k>` too. Its packet carries the record, the reproducing
  row and the line `<row id> D-<k>` in `eval/deferred.txt`, and no story files: it is a packet
  with no story (INCREMENT.md section 3), since it builds nothing and a listed row does not fail
  the run.
- **Not a defect**: no pull request of its own. Its record, with the reason and `Row: none`, rides
  in the next packet opened, whatever it is for; until then it stays in the run directory, and the
  next QA run's numbering skips it.

## What this skill is not

A starting point, not a control. QA's findings are drafts the founder decides on; the gate on
GitHub is the enforcement. You never fix, never write a row into `eval/`, never open a pull
request, and never run `pod-works approve`, `repair`, `protect` or `release`. When a step is blocked, say
what is missing and the command that unblocks it, and go on where you can.
