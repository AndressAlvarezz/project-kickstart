# AGENTS.md

## Project

`project-kickstart` is a Claude Code plugin that bootstraps and runs professional
GitHub projects (issue → plan → PR → review → merge → release). It is published
through a marketplace in this repository and must be usable by anyone, on any OS.

## Stack

- Plugin content: Markdown skills (`skills/<name>/SKILL.md`) and JSON manifests
  (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`).
- Tooling: Node.js ≥ 20.11 with no runtime dependencies, tests with `node:test`,
  `markdownlint-cli2` (dev only), `just` as task runner.
- Target platforms: Windows (PowerShell and Git Bash), macOS and Linux.

## Commands

`just setup` · `just lint` · `just test` · `just build`

## Workflow

- Every change: issue → branch `type/<issue>-<slug>` → PR with `Closes #<n>` →
  green CI → squash merge.
- Conventional Commits for commits and PR titles (the PR title becomes the commit on `main`).
- Every behaviour change ships with a test. Keep changes small; no unrequested refactors.
- Plans live in `docs/plans/`, architecture decisions in `docs/decisions/`.

## Plugin authoring rules

- All shipped content is in English; skills must tell Claude to reply in the user's language.
- Skills must not hard-require optional tools (Codex, `just`): detect them and offer a fallback.
- Shell commands in skills must work in both PowerShell and bash, or give both variants.
- Keep `version` identical in `plugin.json` and `marketplace.json`.
- `docs/reference/` is source material only: never ship or lint it.

## Boundaries

- Do not touch `.env*`, `secrets/` or generated files (`node_modules/`, `package-lock.json` except via npm).
- Do not add dependencies without justifying them in the plan.
- Never push directly or force-push to `main`.

## Code review (also for Codex on GitHub)

Prioritise: logic errors, edge cases, missing or weak tests, security, undocumented
behaviour changes, and skill instructions that are ambiguous, platform-specific or
could make Claude take irreversible actions without confirmation. Ignore style
already covered by the linter.

## Done means

`just lint && just test` green, CI green, plan updated and Codex review resolved.
