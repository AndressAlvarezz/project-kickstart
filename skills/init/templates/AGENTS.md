<!--
Template for AGENTS.md (read by local Codex, Codex on GitHub and Claude).
Placeholders: <goal>, <stack>, <commands>. Without just, <commands> lists the
native setup, lint, test and build commands.
-->
# AGENTS.md

## Project

<goal>

## Stack

<stack>

## Commands

<commands, e.g. `just setup` · `just lint` · `just test` · `just build`>

## Workflow

- Every change: issue → branch `type/<issue>-<slug>` → PR with `Closes #<n>` →
  green CI → squash merge.
- Conventional Commits for commits and PR titles (the PR title becomes the commit on `main`).
- Every behaviour change ships with a test. Keep changes small; no unrequested refactors.
- Plans live in `docs/plans/`, architecture decisions in `docs/decisions/`.

## Boundaries

- Do not touch `.env*`, `secrets/` or generated files.
- Do not add dependencies without justifying them in the plan.
- Never push directly or force-push to `main`.

## Code review (also for Codex on GitHub)

Prioritise: logic errors, edge cases, missing or weak tests, security and
undocumented behaviour changes. Ignore style already covered by the linter.

## Done means

Lint and tests green locally, CI green, plan updated and review resolved.
