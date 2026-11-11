# 2. One skill per mode, shared conventions, optional tools

- Status: accepted
- Date: 2026-11-11
- Issue: #9

## Context

The original workflow is a single 430-line skill with modes (`init`, `feature`,
`release`, `status`) and assumes `just`, Codex and a paid GitHub plan. Plugin
skills are invoked as `/<plugin>:<skill>`, and every user has a different set of
tools.

## Decision

- Ship one skill per mode: `init`, `feature`, `release`, `status`.
- Keep rules shared by all modes in `references/conventions.md`, and long literal
  files in each skill's `templates/` folder.
- `init`, `feature` and `release` are user-invoked only
  (`disable-model-invocation: true`); `status` is read-only and model-invocable.
- Only git and the GitHub CLI are required. `just`, Codex, Codex cloud and the
  Claude GitHub app are detected and optional, each with a documented fallback.

## Consequences

- Shorter skills that load only when needed, and clearer commands for users.
- Conventions must be kept in one place; tests check that skill references to
  shared files resolve.
- Fallback paths (no `just`, no Codex, free private repo) need manual testing.
