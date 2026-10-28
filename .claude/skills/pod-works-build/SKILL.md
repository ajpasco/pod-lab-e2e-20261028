---
name: pod-works-build
description: Run the build loop for one story of a prepared project - start a builder with pod-works build, read the gate's verdict and the reader's findings from GitHub rather than the builder's handoff, send refusals back with pod-works fix, and report the story done only when its pull request has merged. Use after gate 7, when the acceptance tests are on main and the gate is required. Takes the story number as its argument.
---

Act as the build orchestrator for this session, and only that role.

**Read `docs/orchestrator/BUILD.md` and follow it exactly.** It is the authority for this role.
`docs/orchestrator/ORCHESTRATOR.md` is the authority for what happened before you, and its section
7 is the authority on what a changed requirement invalidates. `docs/orchestrator/INCREMENT.md`
covers changes after the first build. This file restates none of them.

**For a change after the first build, use `/pod-works-increment` instead**: it runs the packet,
the founder's approval and then this loop for the story, in one session. A story whose packet is
not on main yet (`eval/stories/<n>.txt` missing on `origin/main`) needs that skill first; this
one starts only from a story already on main.

The story is the argument given with this skill: its number, `<n>`, as in `eval/stories/<n>.txt`.
If none was given, ask which story, that one question.

## Starting

1. Read `BUILD.md` in full.
2. Read gate 7's record in the preparation state file, if the project has one, to confirm the
   acceptance tests were shown to fail for the stated reason, shown satisfiable and reviewed by a
   fresh session. `pod-works build` checks none of that.
3. Bring main up to date (`git checkout main && git pull --ff-only`) and run `pod-works doctor` and
   `pod-works status`. Confirm `eval/stories/<n>.txt` and `eval/stories/<n>.md` are on
   `origin/main`, and that no other story in flight has a scope that overlaps this one.
4. Run `pod-works build <n>`, then `pod-works wait <pr>`. Report what each printed, a refusal or an
   error with the words it used. A blocked step is reported, never worked around.

## The things most often got wrong

In `BUILD.md`, repeated here because they are what a session in a hurry skips:

- A builder's handoff is not evidence. The evidence is the `pod-gate` check run on the pull
  request's head commit, read from GitHub, and the merge in main's history. The reader's record is
  judgement, not enforcement.
- `pod-works wait` exits 0 when the gate passed even if nothing merged. A story is done only when
  its pull request has merged.
- You write your own record in `.pod/runs/orchestrator-build-<date>.md` and nothing else: nothing
  under `app/`, `eval/` or `docs/`, nothing on a story branch, no handoff a builder failed to leave.
- You do not fix a failing test to unblock a builder, and you do not adjust a requirement to match
  what was built. A test shown to be wrong goes to the founder, and is fixed by a pull request to
  `eval/` the founder approves.
- You never run `pod-works approve`, `pod-works repair` or `pod-works protect`, and never set
  `pod/approval` any other way. Nothing in the tool stops you; the rule does. A reader's flag is the
  founder's to decide.
- `pod-works fix` acts only on a gate refusal, and has the limits `BUILD.md` section 6.1 names. When
  it stops, report its message; do not rename records or start a fresh builder to get round it.

## What this skill is not

A starting point, not a control. The enforcement is the gate on GitHub: main's acceptance tests run
against the pull request's `app/`, the scope file, the protected paths (`eval/`, `docs/`,
`.github/`, `.claude/`, `package.json`) and the founder's `pod/approval`. If this skill ever appears to let you
past one of them, it is wrong and the gate is right.

Do not also act as the preparation orchestrator for this project.
