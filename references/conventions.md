# Project Kickstart conventions

Shared rules for every `project-kickstart` skill. Read this file before running
any block.

## Language

- Talk to the user in their language (the language of their messages).
- Everything written to their project is in English: files, branch names, commit
  messages, PR and issue titles and bodies, labels, changelog entries.

## Blocks and checkpoints

1. Run **one block at a time**. After each block, show what you did (files,
   commands and their result), the block's "Done when" criterion and whether it
   is met, then end with:
   `🛑 Checkpoint — reply "continue", "redo" or describe the changes you want.`
   Then **stop** and wait.
2. If the user says "continue all", chain blocks **until the next block marked
   ⚠️**, where you always stop.
3. Persist progress so work can resume in another session, and mark each block
   `[x]` when it is done:
   - setup (`init`): `docs/setup-status.md`
   - feature: the `## Status` section of `docs/plans/<YYYYMMDD>-<slug>.md`
4. If you need to deviate from the block or the plan, stop and explain before
   doing it.

## Check state before acting

The user may act outside the session (merge on the web, switch branches, edit
files). Before every block, check the real state instead of assuming it:
`git status`, `git branch --show-current`, and `gh pr view` / `gh issue view`
when a PR or issue is involved. If the state differs from what you expected,
report it and ask how to proceed.

## Confirmation before outward-facing actions

Ask the user to confirm explicitly, every time, before any action that changes
something outside the local working tree or is hard to undo, even when the
permissions allow it: pushing, creating a repository, changing repository
settings or rulesets, creating or commenting on issues and PRs, creating labels,
merging, publishing releases, deleting branches or files. Show the exact command
first. A confirmation covers only the action it was given for.

Never force-push, never push directly to `main`, never run `git reset --hard`,
and never delete a repository.

## GitHub is the source of truth

Every change starts from an issue, lives on a branch, enters through a PR with
green CI and is squash-merged. Never work directly on `main`.

- Branches: `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<issue>-<slug>`,
  `docs/<issue>-<slug>`.
- Commits and PR titles: Conventional Commits (`feat:`, `fix:`, `refactor:`,
  `test:`, `docs:`, `chore:`, `ci:`). With squash merges, **the PR title becomes
  the commit on `main`**.
- Every PR links its issue with `Closes #<n>` and its plan.
- Versions: SemVer, tags `vMAJOR.MINOR.PATCH`.

## Tool detection and fallbacks

Detect tools at the start of each skill; never fail only because an optional
tool is missing.

| Tool | Required | Detect | If missing |
| --- | --- | --- | --- |
| git | yes | `git --version` | give the install command for the OS and stop |
| GitHub CLI | yes | `gh --version`, `gh auth status` | install, then `gh auth login`; stop until it works |
| `workflow` token scope | for CI files | `gh auth status` lists it | `gh auth refresh -s workflow` |
| just | no | `just --version` | offer to install it; if declined, use the stack's native commands (see below) |
| Codex plugin | no | `/codex:*` commands or the `codex:codex-rescue` agent are available | see "Reviews" |
| Codex CLI | no | `codex --version` | see "Reviews" |

Install commands:

- just: `winget install Casey.Just` (Windows), `brew install just` (macOS),
  `cargo install just` or the distro package (Linux).
- GitHub CLI: `winget install GitHub.cli` (Windows), `brew install gh` (macOS),
  distro package (Linux).
- Codex CLI: `npm install -g @openai/codex`, then `codex login`.
- Codex plugin: `/plugin marketplace add openai/codex-plugin-cc`,
  `/plugin install codex@openai-codex`, `/reload-plugins`, `/codex:setup`.

**Project commands.** Projects expose four commands: setup, lint, test, build.
With `just` they are `just setup | lint | test | build`. Without `just`, use the
stack's native equivalents (`npm run lint`, `make test`, `uv run pytest`…),
record them in the `## Commands` section of `AGENTS.md`, and read them from there
in every later block. Wherever a skill says "the lint command", "the test
command" and so on, use what `AGENTS.md` records.

## Reviews

Reviews are done by Codex when it is available, in this order:

1. **Codex plugin**: ask the user to run the `/codex:*` command the block names
   (you may not be able to invoke slash commands yourself) and to tell you when
   it finishes.
2. **Codex CLI only**: run it read-only yourself, for example
   `codex exec --sandbox read-only "Review docs/plans/<file>: hidden assumptions, edge cases, simpler alternatives, risks"`.
3. **No Codex**: offer a self-review using the block's checklist, clearly labelled
   "self-review by Claude, not independent", or let the user skip the review and
   record that it was skipped.

Never apply review suggestions in bulk. Classify each one as **accept /
debatable / reject** with a one-line reason and let the user choose.

## Shell compatibility

The user may be on Windows PowerShell (5.1 or 7), Git Bash, macOS or Linux.

- PowerShell 5.1 has no `&&` or `||`. Run one command per tool call, or use
  `;` and check `$?` (`git switch main; if ($?) { git pull --ff-only }`).
- Avoid `$(...)` inside arguments, `export`, `rm -rf` and other shell-specific
  syntax in commands meant for both shells. When a command differs, give both
  variants.
- When you suggest a command for the user to run with `!`, give absolute paths:
  that shell may start in their home directory, so a relative path can hit the
  wrong file (for example the global `~/.claude/settings.json`).

## Bodies, temp files and protected files

- Use `--body-file <temp file>` for every issue, PR and comment body instead of
  inline text (quoting differs between shells). Write temp files outside the
  repository, or delete them before committing.
- If you are not allowed to write a file (for example `.claude/settings.json`),
  write it to a temp file and give the user the exact copy command with absolute
  paths, in both variants:
  - PowerShell: `Copy-Item "<temp>\settings.json" "<project>\.claude\settings.json"`
  - bash: `cp "<temp>/settings.json" "<project>/.claude/settings.json"`
