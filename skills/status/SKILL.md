---
name: status
description: Report where a project-kickstart project stands - setup progress, the current feature's block, open issues and PRs, and what to do next. Read-only. Use when the user asks for the project status, what is pending or where they left off.
---

# Status (`/project-kickstart:status`)

Reply in the user's language. This skill is **read-only**: do not edit files,
commit, push, comment or change anything on GitHub. Keep the report short.

## Gather

Run what is available and skip what is not (no repository, no remote, `gh` not
installed or not authenticated); say what was skipped and why.

1. Local state: `git rev-parse --is-inside-work-tree`, `git branch --show-current`,
   `git status --short`, `git log --oneline -5`.
2. Setup: if `docs/setup-status.md` exists, read which blocks (A0–A10) are done
   and its `## Pending` section.
3. Feature: find the plan in `docs/plans/` whose issue number matches the current
   branch (`feat/<n>-…`), or else the most recent plan, and read its `## Status`.
4. GitHub: `gh issue list --assignee @me`, `gh pr status`, and for the current
   branch's PR `gh pr checks`.

## Report

- **Where we are:** setup state, current branch and the feature's current block.
- **Pending:** unchecked blocks, failing checks, open PRs that need attention
  (including Dependabot), items under `## Pending`.
- **Next step:** the single next action, with the command to run (for example
  `/project-kickstart:feature <name>` or the next block of the current feature).

If there is no repository or no project-kickstart files at all, say so and
suggest `/project-kickstart:init`.
