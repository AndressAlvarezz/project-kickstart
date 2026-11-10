# Architecture

## Overview

`project-kickstart` is a Claude Code plugin distributed through a single-plugin
marketplace hosted in this same repository.

```text
.claude-plugin/marketplace.json  →  lists the plugin (source: "./")
.claude-plugin/plugin.json       →  plugin metadata and version
skills/<name>/SKILL.md           →  instructions Claude loads on demand
```

Skills in a plugin are invoked as `/project-kickstart:<skill-name>`.

## Tooling

- `scripts/validate.mjs`: dependency-free validator for manifests and skill
  frontmatter. Used by `just lint` and covered by `tests/`.
- `scripts/official-validate.mjs`: wraps `claude plugin validate .` when the
  Claude Code CLI is installed (`just build`).
- `markdownlint-cli2`: Markdown style (dev dependency only).

## Open decisions

- **Skill layout.** One skill with modes (`/project-kickstart:kickstart init`)
  versus one skill per mode (`/project-kickstart:init`, `:feature`, `:release`,
  `:status`). To be decided in the first feature plan and recorded as an ADR in
  `docs/decisions/`.
- **Optional tools.** How the skills detect `just` and Codex and fall back when
  they are missing.

## Reference material

`docs/reference/proyecto-skill-es.md` is the original Spanish workflow this
plugin is ported from. It is excluded from linting and is not shipped as a skill.
