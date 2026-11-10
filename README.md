# project-kickstart

[![CI](https://github.com/AndressAlvarezz/project-kickstart/actions/workflows/ci.yml/badge.svg)](https://github.com/AndressAlvarezz/project-kickstart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [Claude Code](https://claude.com/claude-code) plugin that bootstraps and runs
professional GitHub projects: issue → plan → pull request → review → merge → release.

> **Status:** early development (v0.1.0). The workflow is being ported from
> its original version and is not ready for general use yet.

## What it does

- **`init`**: sets up the repository, CI, templates, labels and branch protection.
- **`feature <name>`**: drives a feature from an issue to a squash-merged PR,
  with a written plan, tests first and an optional Codex review.
- **`release`**: proposes a semantic version and publishes a GitHub release.
- **`status`**: shows where the project stands and what is pending.

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
just lint    # lint Markdown and validate manifests and skills
just test    # run the test suite
just build   # run the official `claude plugin validate` when available
```

## Project structure

```text
.claude-plugin/   plugin.json and marketplace.json manifests
skills/           the plugin's skills (one folder per skill, each with SKILL.md)
scripts/          validation tooling (no runtime dependencies)
tests/            node:test test suite
docs/             architecture, plans and decision records
```

## License

[MIT](LICENSE)
