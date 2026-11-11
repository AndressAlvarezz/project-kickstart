---
name: release
description: Publish a new semantic version of the project. Lists the changes since the last tag, proposes the next version, moves the changelog entries through a release PR and creates the GitHub release, with checkpoints.
disable-model-invocation: true
---

# Release (`/project-kickstart:release`)

Read `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` first and follow it in
every block: language, checkpoints, confirmations, tool fallbacks and shell
compatibility.

## C1. Preparation ⚠️

1. Check the state: `git status` must be clean (otherwise stop and ask), then
   `git switch main` and `git pull --ff-only`.
2. Find the last tag with `git describe --tags --abbrev=0`. If there is none,
   this is the first release.
3. List the changes: `git log <last-tag>..HEAD --oneline`, or `git log --oneline`
   when there is no tag. Compare them with `## [Unreleased]` in `CHANGELOG.md`
   and point out anything missing.
4. Propose the version with SemVer: a breaking change (`!` or `BREAKING CHANGE`)
   → MAJOR, `feat` → MINOR, only `fix` and other types → PATCH. Before 1.0.0, say
   that breaking changes may bump MINOR instead, and let the user choose.
5. Check that the version in the project's manifests (for example `package.json`)
   will be bumped in the release PR.

**Done when:** the user confirms the version `X.Y.Z`.

## C2. Publication ⚠️

Each command that publishes something runs only after the user confirms it.

1. Create an issue and branch as in the `feature` skill (B1), with title
   `chore: release vX.Y.Z` and branch `chore/<n>-release-vX.Y.Z`.
2. In `CHANGELOG.md`, move the `## [Unreleased]` entries to
   `## [X.Y.Z] - YYYY-MM-DD` (today's date) and leave an empty `## [Unreleased]`.
   Bump the version in every manifest that holds it.
3. Commit `chore: release vX.Y.Z`, `git push -u origin <branch>`, open the PR with
   `gh pr create --title "chore: release vX.Y.Z" --body-file <temp>` (with
   `Closes #<n>`), wait for green CI and merge as in the `feature` skill's B9.
4. Then:

   ```bash
   git switch main
   git pull --ff-only
   gh release create vX.Y.Z --target main --title "vX.Y.Z" --generate-notes
   ```

5. If the project builds artefacts, offer to attach them:
   `gh release upload vX.Y.Z <files>`.

**Done when:** the release is published and its URL is shown to the user.
