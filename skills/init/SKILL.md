---
name: init
description: Set up a new project and its GitHub repository with a professional workflow (structure, agent context, Claude Code permissions, CI, templates, labels, branch protection and an end-to-end test PR), one block at a time with checkpoints.
disable-model-invocation: true
---

# Project setup (`/project-kickstart:init`)

Read `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` first and follow it in
every block: language, checkpoints, confirmations, tool fallbacks and shell
compatibility.

Templates for the files this skill writes are in `${CLAUDE_SKILL_DIR}/templates/`.
Each starts with a comment that lists its placeholders: fill them for this
project and remove the comment; never copy a template blindly.

If `docs/setup-status.md` already exists, read it, tell the user which blocks are
done, and resume from the first unchecked block.

## A0. Environment

Detect the OS and shell, then check: `git --version`, `git config user.name`,
`git config user.email`, `gh --version`, `gh auth status`, `just --version`,
`codex --version` and the stack's runtime if known. Check whether the Codex
plugin is installed.

Report what is present and what is missing, with the install command for this OS
from the conventions. git and gh (authenticated, with the `workflow` scope) are
required; just and Codex are optional, so offer to install them and continue
without them if the user declines.

**Done when:** git and gh work, and the user has decided about each optional tool.

## A1. Project definition ⚠️

Ask **everything in one message**:

1. Repository name (kebab-case) and a one-line description
2. Goal in one or two sentences
3. Language(s) and toolchain
4. Target platforms
5. Visibility: public or private. Warn that on a free GitHub plan, rulesets,
   auto-merge and secret scanning are not available for private repositories
   (GitHub Pro is free with the GitHub Student Developer Pack).
6. License (MIT, Apache-2.0, GPL-3.0, proprietary…)
7. Enable reviews on GitHub (Codex cloud and/or the Claude GitHub app)? Both are
   optional and may use paid quota.
8. Constraints (forbidden dependencies, specific hardware, regulations)

Create `docs/setup-status.md` from `${CLAUDE_SKILL_DIR}/templates/setup-status.md`
with the answers and the tools found in A0.

**Done when:** the user confirms the answers.

## A2. Structure and tasks

Create, adapted to the stack:

```text
AGENTS.md  CLAUDE.md  README.md  LICENSE  CHANGELOG.md  .gitignore  .editorconfig
justfile (only with just)
.claude/settings.json
docs/architecture.md  docs/plans/  docs/decisions/
src/  tests/   (or the stack's usual layout)
```

- With just: a `justfile` with `setup`, `lint`, `test` and `build` recipes that
  run the stack's real commands. Without just: no `justfile`; use the stack's
  native commands and record them in `AGENTS.md` (A3).
- If there are no tests yet, add one minimal test that passes.
- `README.md`: description, requirements, setup and test commands, structure. The
  CI badge comes later, through the test PR in A9.
- `CHANGELOG.md` in Keep a Changelog format with an empty `## [Unreleased]`.

Run the setup, lint and test commands.

**Done when:** all three pass.

## A3. Shared agent context

Write `AGENTS.md` from `${CLAUDE_SKILL_DIR}/templates/AGENTS.md` and `CLAUDE.md`
from `${CLAUDE_SKILL_DIR}/templates/CLAUDE.md`, filled with the A1 answers and the
project commands.

**Done when:** both exist and reflect A1.

## A4. Claude Code permissions and hooks

Write `.claude/settings.json` from `${CLAUDE_SKILL_DIR}/templates/settings.json`.
Without just, replace `Bash(just:*)` with the native commands and the hook's
`just lint` with the native lint command.

Explain that the real protection of `main` is on the server (the ruleset in A7);
the `deny` rules are a second, local barrier. If you cannot write this file,
follow the temp-file procedure in the conventions.

**Done when:** the JSON is valid and the user approves it.

## A5. CI and GitHub templates

Create, from the templates in `${CLAUDE_SKILL_DIR}/templates/`:

| Template | Destination |
| --- | --- |
| `ci.yml` | `.github/workflows/ci.yml` |
| `pr-title.yml` | `.github/workflows/pr-title.yml` |
| `pull_request_template.md` | `.github/pull_request_template.md` |
| `issue-feature.yml`, `issue-bug.yml`, `issue-config.yml` | `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`, `config.yml` |
| `dependabot.yml` | `.github/dependabot.yml` |

Also create `.github/CODEOWNERS` with `* @<github-user>` (from `gh api user -q .login`).

The CI job names are the status checks the ruleset will require (`check`,
`pr-title`). If you add a matrix, the check names get a suffix such as
`check (windows-latest)`: use those exact names in A7.

**Done when:** the files exist and CI runs the same commands as the project.

## A6. GitHub repository ⚠️

1. `git init -b main` if there is no repository yet, `git add .`, commit
   `chore: initial project structure`.
2. Show this command and run it only after the user confirms:

   ```bash
   gh repo create <name> --<private|public> --description "<description>" --source=. --remote=origin --push
   ```

3. Wait for the first CI run (`gh run watch`, or `gh run list --limit 1`). If it
   fails, fix it before going on.
4. Tell the user that Dependabot may open PRs right after this first push; they
   can be handled later (see the `feature` skill's shortcuts).

**Done when:** the repository exists, `main` is pushed and CI is green.

## A7. Repository settings ⚠️

First detect what the plan allows:

- `gh repo view --json isPrivate -q .isPrivate`
- `gh api user -q .plan.name` (`free`, `pro`…; for an organisation repository,
  ask the user about the organisation's plan)

Show every command in this block and run each group only after the user confirms.

Merge settings (on a private repository with a free plan, leave out
`--enable-auto-merge`):

```bash
gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge --enable-auto-merge
gh repo edit --enable-wiki=false
```

Security:

```bash
gh api -X PUT "repos/{owner}/{repo}/vulnerability-alerts"
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
```

Secret scanning on a **private** repository does not depend on the personal plan
(GitHub Pro is not enough): it needs GitHub Secret Protection, which only
organisations on a paid plan can buy. On a private repository, run the secret
scanning command only if the user says the organisation has it; otherwise skip
it and record it under `## Pending`. On a public repository it is free.

Labels:

```bash
gh label create feature --color 0E8A16 --description "New feature" --force
gh label create bug --color D73A4A --description "Something is not working" --force
gh label create chore --color C5DEF5 --description "Maintenance" --force
gh label create docs --color 0075CA --description "Documentation" --force
gh label create needs-plan --color FBCA04 --description "Needs a plan before implementation" --force
gh label create reviewed --color 5319E7 --description "Code review resolved" --force
```

Ruleset for `main`: adapt `${CLAUDE_SKILL_DIR}/templates/ruleset-main.json` (its
required checks must match the real CI job names), save it as
`.github/rulesets/main-protected.json` and apply it:

```bash
gh api -X POST "repos/{owner}/{repo}/rulesets" --input .github/rulesets/main-protected.json
```

Verify with `gh api "repos/{owner}/{repo}/rulesets"`.
`required_approving_review_count` is 0 because you cannot approve your own PRs in
a personal repository; required CI and resolved review threads are the gate.
Raise it to 1 if there are more collaborators.

**Private repository on a free plan:** apply what works, keep the ruleset file in
the repository without applying it, and list the skipped commands under
`## Pending` in `docs/setup-status.md` so they can be run after an upgrade. From
then on, merges are done without `--auto`, after checks are green.

**Any setting the plan does not allow:** if a command fails because the feature
is not available (HTTP 403/404/422 or a message about the plan), do not retry or
work around it. Tell the user, record the command under `## Pending` in
`docs/setup-status.md`, and continue with the rest of the block.

**Done when:** the settings are applied (or recorded as pending) and the ruleset
is active or saved.

## A8. GitHub reviewers (optional, from A1)

Only if the user asked for them in A1; otherwise mark the block as skipped.

- **Codex on GitHub:** the user enables it on the Codex website (connect Codex
  cloud to the repository and turn on *Code review*, optionally *Automatic
  reviews*). Then commenting `@codex review` on a PR requests a review. It reads
  `AGENTS.md`.
- **Claude on GitHub:** in Claude Code, `/install-github-app` installs the app and
  a workflow that answers `@claude` mentions.

Give the steps; the user completes them. Mention that both can use paid quota and
that the local review flow works without them.

**Done when:** the user confirms what they enabled, or that they skip it.

## A9. End-to-end test PR

Validate the whole circuit with a small change: adding the CI badge to the
README. Each command that publishes something runs only after the user confirms.

1. `gh issue create --title "docs: add CI badge to README" --label docs --assignee "@me" --body-file <temp>`
2. If `git status` shows uncommitted changes, stop and ask (see the `feature`
   skill's B0). Then
   `gh issue develop <n> --name docs/<n>-ci-badge --base main --checkout`.
3. Add the badge, commit `docs: add CI badge to README`, then `git push`.
4. `gh pr create --title "docs: add CI badge to README" --body-file <temp>` with
   the PR template filled and `Closes #<n>`.
5. Review: follow "Reviews" in the conventions (for example `/codex:review --base main`).
6. `gh pr checks --watch`, then merge: `gh pr merge --squash --auto`, or
   `gh pr merge --squash` once checks are green if auto-merge is not available.
7. `git switch main`, `git pull --ff-only`, delete the local branch
   (`git branch -d docs/<n>-ci-badge`) and check that the issue was closed.

**Done when:** the PR is merged, the issue is closed and local `main` is up to date.

## A10. Wrap-up

Mark `docs/setup-status.md` as complete and summarise: repository URL, active
protections, anything pending, and reviewers configured. Suggest the first
feature: `/project-kickstart:feature <name>`.
