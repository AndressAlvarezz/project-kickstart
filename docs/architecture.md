# Architecture

## Overview

`project-kickstart` is a Claude Code plugin distributed through a single-plugin
marketplace hosted in this same repository.

```text
.claude-plugin/marketplace.json  →  lists the plugin (source: "./")
.claude-plugin/plugin.json       →  plugin metadata and version
skills/<name>/SKILL.md           →  instructions Claude loads on demand
skills/<name>/templates/         →  files a skill adapts and writes into user projects
references/conventions.md        →  rules shared by every skill
```

Skills in a plugin are invoked as `/project-kickstart:<skill-name>`. There is one
skill per mode: `init`, `feature`, `release` and `status` (see ADR 0002). Each
skill starts by reading `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` and
refers to its templates with `${CLAUDE_SKILL_DIR}/templates/...`.

## Tooling

- `scripts/validate.mjs`: dependency-free validator for manifests and skill
  frontmatter. Used by `just lint` and covered by `tests/`.
- `scripts/official-validate.mjs`: wraps `claude plugin validate .` when the
  Claude Code CLI is installed (`just build`).
- `scripts/content-checks.mjs`: checks shipped content in `skills/` and
  `references/`: `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_SKILL_DIR}` paths resolve, no
  Spanish text remains, JSON templates parse, and every section with an
  outward-facing command (`git push`, `gh pr merge`, mutating `gh api`…) also
  asks for confirmation. Used by `just lint` and covered by `tests/`.
- `markdownlint-cli2`: Markdown style (dev dependency only).

## Decisions

- [0002](decisions/0002-skill-per-mode-and-optional-tools.md): one skill per
  mode, shared conventions, optional tools with fallbacks.

## Reference material

`docs/reference/proyecto-skill-es.md` is the original Spanish workflow this
plugin is ported from. It is excluded from linting and is not shipped as a skill.
