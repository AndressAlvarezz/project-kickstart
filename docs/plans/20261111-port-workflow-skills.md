# Plan: port workflow skills to English (#9)

## Goal and acceptance criteria

Port the original Spanish workflow (`docs/reference/proyecto-skill-es.md`) into
English plugin skills that any Claude Code user can run, on any OS, without
depending on the author's toolset.

Acceptance criteria (from #9):

- [ ] One skill per mode: `/project-kickstart:init`, `:feature <name>`, `:release`, `:status`; the placeholder `kickstart` skill is removed
- [ ] All shipped content is in English; skills tell Claude to reply in the user's language
- [ ] Files, branches, commits and templates generated in user projects are in English
- [ ] Codex and `just` are optional: detected, with a fallback instead of a failure
- [ ] Commands are valid in PowerShell and bash, or both variants are given
- [ ] Private repo without GitHub Pro: rulesets, auto-merge and secret scanning are skipped with a clear note
- [ ] Every irreversible or outward-facing action still requires explicit confirmation
- [ ] Validator and tests cover the new skills; `just lint`, `just test`, `just build` pass; README documents the commands
- [ ] ADR records the skill layout and optional tools

## Approach

### Layout

```text
references/
  conventions.md        shared rules: checkpoints, confirmations, branches, commits,
                        tool detection and fallbacks, shell compatibility
skills/
  init/SKILL.md         part A (A0–A10), adapted
  init/templates/       files init writes into user projects
  feature/SKILL.md      part B (B0–B9)
  feature/templates/    plan.md
  release/SKILL.md      part C (C1–C2)
  status/SKILL.md       read-only status report
```

- Shared rules live once in `references/conventions.md`; each skill starts with
  "Read `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` first". This keeps each
  `SKILL.md` short (target < 300 lines) and avoids four diverging copies.
- Long literal files (CI workflow, PR template, issue forms, `dependabot.yml`,
  `.claude/settings.json`, ruleset JSON, `AGENTS.md`/`CLAUDE.md` skeletons, plan
  skeleton) move out of the instructions into `templates/`, referenced with
  `${CLAUDE_SKILL_DIR}/templates/...`. Claude adapts them to the stack instead of
  re-typing them from prose.
- Frontmatter: `name`, `description`, `argument-hint`. `init`, `feature` and
  `release` set `disable-model-invocation: true` (they push, merge and change repo
  settings, so they only run when the user types them). `status` stays
  model-invocable because it is read-only.

### Translation and generated content

- Faithful port of every block, its "Done when" criterion and its checkpoint, in English.
- Generated artefacts in English: `docs/setup-status.md` (was `setup-estado.md`),
  `chore: initial project structure`, label descriptions, issue/PR bodies.
- Every skill says: talk to the user in their language; keep files, branches,
  commits and PR titles in English.

### Optional tools (detected in A0 and at the start of each skill)

| Tool | Required? | If missing |
| --- | --- | --- |
| git, gh (+ `gh auth`) | yes | install command per OS; stop until available |
| `workflow` scope | yes, for CI files | `gh auth refresh -s workflow` |
| just | no | offer install; if declined, use the stack's native commands (`npm run`, `make`, `uv run`…) and record them in `AGENTS.md`; no `justfile`, CI calls them directly |
| Codex plugin | no | try `codex exec --sandbox read-only "<prompt>"`; if no Codex CLI either, offer a Claude self-review with an explicit checklist, clearly labelled as not independent, or skip |
| Codex cloud / Claude GitHub app | no | A8 is optional and presented as such, with the cost note |

### Repo-plan limits

In A7, detect `gh api repos/{owner}/{repo} -q .private` and the plan. If private
on a free plan: apply what works, write the ruleset to
`.github/rulesets/main-protected.json`, skip auto-merge and secret scanning, add
the pending commands to `docs/setup-status.md`, and merge later without `--auto`.

### Lessons from this repo's own setup, built into the skills

- Commands the user runs with `!` may start in their home directory: always give
  absolute paths, and never a relative path to a settings file.
- Claude may be blocked from writing `.claude/settings.json`: write it to a temp
  file and give the user the exact copy command with absolute paths.
- PowerShell 5.1 has no `&&`: one command per call, or `;` with `if ($?)`.
- Use `--body-file` with a temp file for every issue/PR/comment body.
- Uncommitted changes before `gh issue develop --checkout` (B0): stop, as the
  original B0 does, and ask the user to commit, stash or abort. If they choose
  stash, use a named stash (`git stash push -u -m "kickstart: before #<n>"`),
  check that it succeeded, and never pop it automatically: the changes belong to
  the previous branch, so tell the user how to restore them there
  (`git switch <previous>` then `git stash pop`). The new branch starts clean.
- Ruleset required checks must match real job names, including matrix suffixes
  (`cross-platform (windows-latest)`).
- Dependabot opens PRs right after the first push: mention it in A6.
- The user may act outside the session (merge on the web, switch branches): check
  state (`git status`, `gh pr view`) before every step instead of assuming.

### Tooling changes

- `scripts/validate.mjs`: accept and type-check `argument-hint` (string) and
  `disable-model-invocation` (boolean); parse `true`/`false`.
- New `scripts/content-checks.mjs` (pure functions, used by tests and `just lint`):
  - every `${CLAUDE_PLUGIN_ROOT}/…` and `${CLAUDE_SKILL_DIR}/…` path in skills resolves to a file;
  - no Spanish left in `skills/` and `references/` (characters `¿¡ñ` and accented
    vowels, plus a short list of words from the original: `rama`, `hecho cuando`, `punto de control`…);
  - every JSON template parses;
  - confirmation per action block: skills and `references/conventions.md` are
    split into sections (each `##`/`###` heading starts one); every section that
    contains an outward-facing command must itself contain a confirmation
    instruction (`confirm`, case-insensitive). A confirmation in another section
    does not count. Outward-facing commands: `git push`, `gh repo create`,
    `gh repo edit`, `gh api` with `-X`/`--method` other than `GET`,
    `gh issue create`, `gh issue comment`, `gh issue develop`, `gh pr create`,
    `gh pr comment`, `gh pr merge`, `gh pr ready`, `gh label create`,
    `gh release create`. The rule is a heuristic (it checks that the instruction
    is there, not that Claude follows it), stated as such in the code.

## Files to create / modify

| File | Change |
| --- | --- |
| `references/conventions.md` | new |
| `skills/init/SKILL.md`, `skills/init/templates/*` | new |
| `skills/feature/SKILL.md`, `skills/feature/templates/plan.md` | new |
| `skills/release/SKILL.md`, `skills/status/SKILL.md` | new |
| `skills/kickstart/` | delete |
| `scripts/validate.mjs` | new frontmatter fields |
| `scripts/content-checks.mjs`, `tests/content-checks.test.mjs` | new |
| `tests/validate.test.mjs` | cases for new fields |
| `justfile` | `lint` also runs content checks |
| `README.md`, `docs/architecture.md`, `CLAUDE.md` | document the commands and layout |
| `docs/decisions/0002-skill-per-mode-and-optional-tools.md` | new ADR |
| `CHANGELOG.md` | `Unreleased` entry |

## Tests that will prove it works

Automated (`just test`), written first in B4 and expected to fail until B5:

1. The plugin exposes exactly the skills `init`, `feature`, `release`, `status`.
2. `init`, `feature`, `release` have `disable-model-invocation: true`; `status` does not.
3. Every skill has an `argument-hint` where it takes arguments (`feature`).
4. All `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_SKILL_DIR}` references resolve.
5. No Spanish markers in shipped content.
6. All JSON templates parse.
7. Every section with an outward-facing command has a confirmation instruction in
   that same section. Unit tests of the checker, including negative cases: a
   section with `git push` and no confirmation while another section confirms
   (fails); unconfirmed `gh issue create`, `gh pr create` and `gh pr comment`
   (fail); `gh api` with `GET` only (passes).
8. The `feature` skill tells Claude to stop on a dirty working tree before B0 and
   never to run `git stash pop` on the new branch.
9. Validator unit tests for the new frontmatter fields (valid and invalid).

Manual (recorded in the PR):

- `claude --plugin-dir .` in a throwaway directory: the four skills appear with
  their hints; `/project-kickstart:status` reports correctly with no repo;
  `/project-kickstart:init` runs A0–A2 on a temp folder without `just`/Codex and
  offers the fallbacks. No push.
- `claude plugin validate .` passes.

## Risks and edge cases

- **Long instructions drift.** Mitigation: short skills, shared conventions,
  templates instead of prose, explicit checkpoint after every block.
- **Template variables.** Templates contain placeholders (`<owner>`, stack setup
  step); Claude must fill them, not copy blindly. Mitigation: a header comment in
  each template listing its placeholders; the YAML ones are not parsed by tests
  (no YAML parser without a new dependency) — see out of scope.
- **Spanish heuristic false positives** (e.g. a name like "Andrés"). Scope is only
  `skills/` and `references/`; the check reports file and line.
- **`${CLAUDE_SKILL_DIR}` support** varies by Claude Code version. Mitigation:
  README states the minimum version tested; fall back to
  `${CLAUDE_PLUGIN_ROOT}/skills/<name>/...` if manual testing shows a problem.
- **Behaviour change for the author**: `/proyecto` keeps working (user-level skill);
  switching this repo to `/project-kickstart:*` happens after the first release.

## Out of scope

- Quick vs. full `init` mode (follow-up feature).
- Parsing YAML templates in tests (would need a `yaml` dev dependency; revisit if templates break).
- Plugin icon, marketplace submission, making the repo public.
- Codex cloud / Claude GitHub app automation beyond documenting the steps.

## Codex review

`/codex:adversarial-review` on 2026-11-11, verdict *needs-attention*, two findings:

| Finding | Severity | Decision | Change |
| --- | --- | --- | --- |
| Auto stash/pop carries previous work onto the new feature branch | medium | accepted | B0 stops on a dirty tree; optional named stash, never auto-popped (lessons section, test 8) |
| A single "confirm" anywhere lets other actions pass unconfirmed; missing issue/PR/comment commands | medium | accepted | Per-section check, wider command list, negative tests (tooling section, test 7) |

## Status

- [x] B1 Issue and branch
- [x] B2 Plan
- [x] B3 Plan review (Codex)
- [x] B4 Tests + draft PR
- [x] B5 Implementation
- [x] B6 Verification
- [ ] B7 Code review (Codex)
- [ ] B8 Fixes
- [ ] B9 Merge
