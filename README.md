# project-kickstart

[![CI](https://github.com/AndressAlvarezz/project-kickstart/actions/workflows/ci.yml/badge.svg)](https://github.com/AndressAlvarezz/project-kickstart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [Claude Code](https://claude.com/claude-code) plugin that bootstraps and runs
professional GitHub projects: issue → plan → pull request → review → merge → release.

> **Status:** stable (v1.0.0). Tested with Claude Code 2.1.322.
> Feedback and bug reports are welcome.

## What it does

| Command | What it does |
| --- | --- |
| `/project-kickstart:init` | Sets up the project and its GitHub repository: structure, `AGENTS.md`/`CLAUDE.md`, Claude Code permissions, CI, templates, labels, branch protection and an end-to-end test PR. |
| `/project-kickstart:feature <name>` | Drives a feature from an issue to a squash-merged PR: plan, plan review, tests first, implementation, code review, merge. |
| `/project-kickstart:release` | Proposes the next semantic version and publishes a GitHub release through a release PR. |
| `/project-kickstart:status` | Read-only report of where the project stands and the next step. |

Every skill works in blocks and stops at checkpoints, talks to you in your
language and writes everything to your project in English. Pushes, merges,
repository settings and anything else that leaves your machine always need your
explicit confirmation.

`init`, `feature` and `release` only run when you type them; `status` can also be
used by Claude when you ask where things stand.

### Optional tools

Only Git and the GitHub CLI are required. The skills detect the rest:

- **just**: without it, your project's native commands (`npm run test`,
  `make`…) are recorded in `AGENTS.md` and used instead.
- **Codex** (plugin or CLI): reviews plans and code. Without it, Claude offers a
  self-review, clearly labelled as not independent, or you can skip the review.
- **Private repository**: secret scanning needs GitHub Secret Protection, so it
  is skipped unless your organisation has it. On a free plan, rulesets and
  auto-merge are skipped too. Skipped settings are recorded as pending in
  `docs/setup-status.md`.

## Installation

```text
/plugin marketplace add AndressAlvarezz/project-kickstart
/plugin install project-kickstart@project-kickstart
```

## Requirements

- [Claude Code](https://claude.com/claude-code)
- [Git](https://git-scm.com/) and [GitHub CLI](https://cli.github.com/) (`gh auth login`)
- Optional: [just](https://github.com/casey/just) and the [Codex CLI](https://github.com/openai/codex)

## Development

Requires Node.js ≥ 20.11 and [just](https://github.com/casey/just).

```sh
just setup   # install dev dependencies
just lint    # lint Markdown, validate manifests and skills, run content checks
just test    # run the test suite
just build   # run the official `claude plugin validate` when available
```

## Project structure

```text
.claude-plugin/   plugin.json and marketplace.json manifests
skills/           init, feature, release, status (SKILL.md + templates/)
references/       conventions shared by every skill
scripts/          validation and content checks (no runtime dependencies)
tests/            node:test test suite
docs/             architecture, plans and decision records
```

## License

[MIT](LICENSE)
