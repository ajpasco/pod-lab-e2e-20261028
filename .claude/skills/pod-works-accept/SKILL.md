---
name: pod-works-accept
description: Prepare the founder's acceptance of a merged application, the last step before release - check whether main is green and whether a /pod-works-qa all record covers this commit, warning and naming the next command when not, have an acceptance-walker subagent turn QA's record and the merged stories into a walkthrough script with the row counts, write a draft of the acceptance note to .pod/runs/acceptance-<date>-draft.md, then tell the founder how to record it with the approval console and approve it, and stop. Never records or approves the acceptance. Use after /pod-works-qa all. Takes an optional merge commit as its argument, main's head by default.
---

Prepare the founder's acceptance, for this session, and only that.

**Read `docs/orchestrator/INCREMENT.md` sections 8 and 9 and follow them.** They are the
authority: the founder's own record is the evidence, and the walk prepared here is not. This file
is the order you run them in.

The argument is a merge commit on main. Without one, it is main's head.

Your one file is `.pod/runs/acceptance-<date>-draft.md`, `<date>` today as `YYYY-MM-DD`. Never
`docs/acceptance/`, never anything under `app/`, `eval/` or `docs/`.

**Warn, don't lock.** Acceptance is the founder's own record, not a merge. Where something is
missing, say what, name the command that supplies it, and ask whether to go on; if the founder
goes on, the draft records it. You stop only for the founder's acts, and refuse only what would
corrupt state.

## 1. Start

1. Bring main up to date (`git checkout main && git pull --ff-only`) and resolve the commit: the
   argument, or `git rev-parse origin/main`. Not in main's history
   (`git merge-base --is-ancestor <commit> origin/main`): refuse, since a note would name a commit
   main never had, and name main's head as the one to use. Not main's head: say the acceptance
   will name an older commit than main's.
2. **Is main green on that commit?** A story merges squashed, so the gate ran on the pull request,
   not on the merge commit. Find it (`gh pr list --state merged --base main --search <commit>
   --json number,mergeCommit`) and read its `pod-gate` check (`gh pr checks <pr>`). An open packet
   or story (`gh pr list --state open`) means the feature is not finished. Either way, say so and
   name the next command (`pod-works wait <pr>` for a pull request in flight, `/pod-works-increment`
   for a merged packet whose story is not built). Say also that while main is red the gate will
   refuse the acceptance pull request too, so it cannot merge until main is green.
3. **Does a QA pass cover this commit?** Look under `.pod/runs/` for the newest `qa-all-<ts>/`
   directory from `/pod-works-qa all` and read its `summary.json`, by exactly these field names:
   `scope` (`"all"`), `main` (the full sha QA ran on), `stories` (`[{n, pr, merge}]`),
   `startedAt`, `finishedAt`, `rows` (`{pass, fail}`), `criteria`
   (`{met, partlyMet, unmet, notChecked}`), `defects` (`[{id, severity, recommendation,
   decision}]`, `decision` null until the founder decides) and `dropped`. It covers the commit
   when `main` is the commit, or when `git diff --name-only <main> <commit>` touches nothing under
   `app/`, nothing under `eval/` other than `eval/deferred.txt`, and neither `package.json` nor
   `package-lock.json`: the defect decisions land as records and a deferred list, which move main
   without changing what QA tested. Otherwise warn, in these words: "QA pass ran on <main, first
   twelve characters>, and app/ or the tests changed since", and offer `/pod-works-qa all`. No
   record at all: say so and offer `/pod-works-qa all`. Never refuse on it. `.pod/runs/` is local
   to one machine, so this check is only as good as the machine it runs on, the founder's: a QA
   pass run elsewhere is not found here. A defect whose `decision` is null: say so, and name the
   run's `decisions.md` and the console's Defects section (`pod-works up`) where the founder
   decides it.
4. If anything in 2 or 3 was missing, ask the founder once whether to go on. On their word, go on
   and carry each gap into the draft (section 3).
5. A worktree at the commit for the walker: `git worktree add --detach .pod/worktrees/walk-<the
   first twelve characters> <commit>`. Not `.pod/worktrees/acceptance-<date>`: the console's
   accept action makes that one.

## 2. The pre-review

The pre-review does not redo QA, which drives every criterion. It turns QA's record and decision
list and the merged stories into a script the founder can follow.

**Spawn the `acceptance-walker` subagent** with the Agent tool. Give it the commit, the worktree
path, the QA run directory and its `main` (or that there is none), whether `app/` or the tests
changed since that `main` (step 1.3), and the date. Nothing else: not your reading of QA's
findings, not a verdict.

Check its decisive claims yourself: the row counts against `eval/report/rows.txt` in the
worktree, the deferred list against `git show <commit>:eval/deferred.txt` (the format
`parseDeferred` in `cli/src/console/state.ts` reads: the row id, then `D-<k>`; a line with no
`D-<k>` defers nothing, so name it as a problem), and the unmet criteria and open defects against
`summary.json`'s `criteria` and `defects` and `docs/defects/`. You open no defect: that is
the QA pass and the founder's decision, INCREMENT.md section 9. Then remove the worktree
(`git worktree remove --force .pod/worktrees/walk-<...>`); the founder walks in their own
checkout.

## 3. The draft note

Write `.pod/runs/acceptance-<date>-draft.md` in exactly the shape the console's accept action
writes, `acceptanceNote` in `cli/src/console/actions.ts`:

```markdown
# Acceptance, <date>

- Commit: <commit, first twelve characters>
- Date: <date>
- By: <login>

## Verdict

<verdict>

## Known limitations

<one line per entry of eval/deferred.txt at the commit: "- <row> (D-<k>)", or "- <row>" when it
names no defect; the single line "none" when there are none>
```

`<login>` is `gh api user --jq .login`, the login the console uses. The commit is twelve characters
because the console fills its commit box with main's head that long.

**Gaps the founder went on past** are added to Known limitations, after the deferred lines, one
each: `- QA pass not run on this commit` (or `- QA pass ran on <sha>, and app/ or the tests
changed since`), `- pod-gate not green on this commit`, `- open: #<pr>`, `- QA defects not yet
decided: D-<k>, ...`. Repeat them, without the deferred lines, in a block headed "Other known
limitations, for the console", one per line: the console's "Other known limitations" box takes
them and writes them under Known limitations after the deferred rows.

The verdict is the founder's. Write in its place exactly:

```
[Your verdict, in your words. Only what you type in the console's verdict box goes into the note.]

Suggested, not yours until you write it: "<one sentence: walked on <commit>; what was walked; the
deferred defects accepted as known limitations, by id>"
```

Under the note, after a line `---`, add the walkthrough script, the QA run directory, the row
counts, `summary.json`'s `criteria` counts with each criterion QA found unmet or met in part, and
the open defects. The console fills the
date, login and deferred lines itself on the day it is recorded, from main at that moment, so the
draft previews them; it is not their source.

## 4. The handoff

Tell the founder, in these words or close to them, and then the exact steps:

> The acceptance is yours alone. Walk the feature yourself with the script; your record, not the
> agent's walk, is the evidence.

1. Walk it with the script in `.pod/runs/acceptance-<date>-draft.md`, on main (or
   `git checkout <commit>` when accepting an older commit, then `git checkout main`).
2. `pod-works up` opens the approval console. In its Acceptance section, check that "Walked on
   merge commit" holds `<commit>` (it fills in main's head; type it if main has moved), write your
   verdict in "Your verdict, in your words" (the draft's suggestion is there to adapt, not to
   paste unread), paste the draft's "Other known limitations, for the console" lines into "Other
   known limitations", and press "Record acceptance". It writes
   `docs/acceptance/<date>.md` on a new branch `docs/acceptance-<date>` and opens the pull request
   `docs: acceptance, <date>`. One per day: if that branch exists, the console says so; delete the
   branch (`git branch -D docs/acceptance-<date>`, and `git push origin --delete
   docs/acceptance-<date>` if it was pushed) to record again.
3. `pod-works approve <pr>`, or the console's approve button for it. `docs/` is protected, so the
   note waits for your approval on its exact commit, then merges on green. `pod-works wait <pr>`
   watches it.

If the founder decides not to accept, that is the answer: nothing is recorded, and what they found
goes to `/pod-works-qa` or `/pod-works-increment`.

## 5. Stop

You never press "Record acceptance", never write `docs/acceptance/`, never run `pod-works
approve`, and never set `pod/approval`. When the founder says it is recorded, confirm it from
GitHub: the pull request merged and `docs/acceptance/<date>.md` on main naming the commit
(`git fetch origin main && git show origin/main:docs/acceptance/<date>.md`). The release is the
founder's next act, `pod-works release <version>`; name it, never run it, and end there.

## What this skill is not

A preparation, not a record. The record is the founder's note under `docs/acceptance/`, a
protected path, approved by them on its exact commit. Nothing in pod-works checks that this skill
ran before an acceptance is recorded.
