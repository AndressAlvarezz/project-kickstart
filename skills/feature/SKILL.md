---
name: feature
description: Drive one feature from issue to squash-merged PR with a written plan, a plan review, tests first, a code review and checkpoints. Claude designs and implements, Codex (or a fallback) reviews, the user decides.
argument-hint: <name>
disable-model-invocation: true
---

# Feature (`/project-kickstart:feature <name>`)

Feature name: `$ARGUMENTS`. If it is empty, ask for it.

Read `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` first and follow it in
every block: language, checkpoints, confirmations, tool fallbacks and shell
compatibility. "The lint/test/build command" means the project command recorded
in `AGENTS.md` (`just lint` etc. when the project uses just).

Roles: **Claude designs → the plan is reviewed → Claude implements → the code is
reviewed → the user decides.** Everything is traceable in the issue and the PR.

If a plan for this feature already exists in `docs/plans/`, read its `## Status`,
check the real state (branch, PR, CI) and resume from the first unchecked block.

## B0. Sync

1. Run `git status`. If there are uncommitted changes, **stop** and ask the user
   what to do; do not switch branches with a dirty tree. Offer:
   - commit them on their current branch;
   - stash them with a name: `git stash push -u -m "kickstart: before <name>"`,
     then check with `git stash list` that the stash exists. Never pop it on the
     new branch: the changes belong to the previous branch. Tell the user how to
     restore them there later: `git switch <previous-branch>` then `git stash pop`;
   - abort the feature.
2. With a clean tree: `git switch main`, then `git pull --ff-only`.

**Done when:** the tree is clean and `main` is up to date.

## B1. Issue and branch

Ask, in one message, for the goal and acceptance criteria if they are missing.
Use an existing issue if the user gives its number. Show the commands and run them
only after the user confirms:

```bash
gh issue create --title "feat: <name>" --label feature --label needs-plan --assignee @me --body-file <temp>
gh issue develop <n> --name feat/<n>-<slug> --base main --checkout
```

`gh issue develop` links the branch to the issue on GitHub. Use `fix/`, `docs/`
or `chore/` and the matching label for other kinds of work.

**Done when:** the issue exists and the linked branch is checked out.

## B2. Plan ⚠️

Read-only: explore the code and **edit nothing except the plan**. Create
`docs/plans/<YYYYMMDD>-<slug>.md` from `${CLAUDE_SKILL_DIR}/templates/plan.md`.
Record significant architecture decisions as an ADR in
`docs/decisions/NNNN-<title>.md`.

Commit `docs: plan for <name>`.

**Done when:** the user approves the plan.

## B3. Plan review ⚠️

Follow "Reviews" in the conventions. With the Codex plugin, ask the user to run:

```text
/codex:adversarial-review docs/plans/<file>: hidden assumptions, edge cases, simpler alternatives and risks
```

Self-review checklist (fallback): hidden assumptions, edge cases, missing tests,
simpler alternatives, platform-specific steps, irreversible actions without
confirmation.

Classify each objection as **accept / debatable / reject** with a one-line
reason. Update the plan only with what the user approves and summarise the result
in its `## Review` section. Commit `docs: apply plan review for <name>`.

Then, after the user confirms, post the summary on the issue and remove the label:
`gh issue comment <n> --body-file <temp>` and
`gh issue edit <n> --remove-label needs-plan`.

**Done when:** the plan is reviewed and approved.

## B4. Tests first + draft PR

Write the tests from the plan, run the test command and **check that they fail
for the expected reason**. Commit `test: <name>`.

After the user confirms, push and open a draft PR so CI runs from the start:

```bash
git push -u origin feat/<n>-<slug>
gh pr create --draft --title "feat: <name>" --body-file <temp>
```

The body follows the PR template, with `Closes #<n>` and the plan path. CI is
expected to fail at this point.

**Done when:** the tests fail as expected and the draft PR is open.

## B5. Implementation

Write the minimum code that makes the tests pass, following the plan. If you need
to deviate, stop and explain first. Keep commits small and atomic. Suggest
`/compact` if the context is getting full.

When done, push after the user confirms (`git push`), then `gh pr checks`.

**Done when:** the test command passes locally.

## B6. Verification

Run the lint, test and build commands locally and `gh pr checks --watch`
remotely. Check every acceptance criterion. If CI fails, read
`gh run view --log-failed` and fix it.

**Done when:** local and CI are green and every criterion is covered.

## B7. Code review ⚠️

Follow "Reviews" in the conventions. With the Codex plugin, ask the user to run
`/codex:review --base main` (add `/codex:adversarial-review --base main` for major
design changes). With Codex on GitHub, `@codex review` in a PR comment also works.

Self-review checklist (fallback): logic errors, edge cases, missing or weak tests,
security, undocumented behaviour changes, platform-specific commands.

Put every finding in a table: severity (high/medium/low), file, problem,
proposal, recommendation (apply / do not apply). After the user confirms, post the
table on the PR: `gh pr comment <pr> --body-file <temp>`.

**Done when:** the user has chosen what to apply.

## B8. Fixes

Apply only what was approved, one commit per finding (`fix:` or `refactor:`).
Push after the user confirms and repeat B6. For rejected findings, reply in their
thread with the reason; every thread must end resolved (the ruleset requires it).
If something gets stuck, `/codex:rescue` can propose a minimal patch. Repeat B7
if the changes were large.

After the user confirms, add the label: `gh pr edit <pr> --add-label reviewed`.

**Done when:** CI is green and every thread is resolved.

## B9. Merge ⚠️

Update the plan (status and deviations) and add an entry under `## [Unreleased]`
in `CHANGELOG.md`. Push after the user confirms. If the PR is still a draft, run
`gh pr ready <pr>`. Check that the PR title follows Conventional Commits (it
becomes the commit on `main`).

Merge only after the user confirms:

```bash
gh pr merge <pr> --squash --auto
gh pr checks <pr> --watch
```

Without auto-merge (private repository on a free plan), wait for green checks and
run `gh pr merge <pr> --squash`.

After the merge: `git switch main`, `git pull --ff-only`,
`git branch -d feat/<n>-<slug>`, and check the issue is closed (`gh issue view <n>`).

**Done when:** the PR is merged, the issue is closed and local `main` is up to date.

## Shortcuts

Every shortcut still needs the user to confirm each push, PR, comment and merge.

- **Bug:** B0 → B1 (label `bug`, branch `fix/…`) → a test that reproduces the bug
  (B4) → B5 → B6 → B7 → B8 → B9.
- **Trivial change** (typo, docs): issue, branch and PR as usual (the ruleset
  allows no other way), without a plan or an adversarial review.
- **Two possible approaches:** two worktrees and two draft PRs; Claude implements
  one and Codex (`/codex:rescue`) the other. Compare diffs and CI, then close the
  discarded PR with a comment explaining why.
- **Dependabot PR:** review it and run `gh pr checks <pr>`; if it is green and a
  minor or patch update, offer to merge it with `gh pr merge <pr> --squash` and
  wait for the user to confirm.
