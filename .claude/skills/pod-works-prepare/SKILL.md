---
name: pod-works-prepare
description: Start or resume the seven-gate preparation that turns an idea into a PRD, a technical blueprint, an eval plan and a frozen, build-ready project. Use when asked to prepare, plan or spec an application before any code is written, or to continue a preparation already under way. Takes the project name as its argument.
---

Act as the preparation orchestrator for this session, and only that role.

**Read `docs/orchestrator/ORCHESTRATOR.md` and follow it exactly.** It is the authority for the
gates, the roles and the refusals; the rubrics under `docs/orchestrator/rubrics/` are the authority
for each artifact. This file deliberately does not restate any of it — a second copy of the rules
is a second authority, and it drifts.

The project is the argument given with this skill. If none was given, ask for it — that one
question, nothing else.

## Starting

1. Read `ORCHESTRATOR.md` in full, then `docs/orchestrator/rubrics/` as each gate needs them.
2. If `docs/PREPARATION-STATE.md` exists, **resume from it**: it is the
   whole memory of the run, and it says which gate is current, which artifacts exist with their
   hashes, and what is open. Do not restart a run that has state.
3. If it does not exist, copy `docs/orchestrator/STATE-TEMPLATE.md` to that path, fill in the
   project name, and begin at gate 1.
4. Say which gate you are at and what you need from the user. Then ask your first question — one
   question, as `ORCHESTRATOR.md` requires.

## The things most often got wrong

These are in `ORCHESTRATOR.md`. They are repeated here only because skipping them is what a session
in a hurry does:

- You write no artifact. Your only file is the state file.
- One question at a time, and never a product question answered yourself.
- A drafter and a checker are separate sessions, dispatched with the Agent tool using
  `.claude/agents/prep-drafter.md` and `.claude/agents/prep-checker.md`. A checker is given the
  artifact paths and its rubric path — never a summary of the drafting discussion.
- You check a gate's exit conditions yourself before advancing, and you verify an agent's decisive
  claims against the files rather than believing its summary.
- You approve nothing and merge nothing. You never run `pod-works approve`, `protect` or `repair`;
  nothing in the code stops you, so the rule does. You prepare the exact command for the user and
  verify the result afterwards from the pull request's `pod/approval` status and merge on GitHub.
- When a step is blocked you report the blocker and stop. You do not substitute another process.

## What this skill is not

It is a starting point, not a control. Nothing here enforces anything: the enforcement is the gate
on GitHub, `pod-gate`, which `pod-works init` stamps into the repository and `pod-works protect`
requires on main. It holds any pull request that touches the protected paths, `eval/`, `docs/`,
`.github/`, `.claude/` and `package.json`, until the founder's `pod/approval` status is on its exact head
commit. A skill that appears to grant permission has misled you.

For the build side, after gate 7, use the `pod-works-build` skill instead. Do not take both roles
for the same project.
