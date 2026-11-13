# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-13

### Fixed

- `status` and `init` also read `docs/setup-estado.md`, the setup file of
  projects created with the original workflow (#13).

## [0.1.0] - 2026-11-11

### Added

- Initial plugin structure, manifests, validation scripts and tests.
- Workflow skills `init`, `feature`, `release` and `status`, ported to English
  from the original workflow, with shared conventions and templates (#9).
- Optional `just` and Codex: detected, with fallbacks. Private repositories skip
  the settings their plan cannot use, and secret scanning unless the
  organisation has GitHub Secret Protection (#9).
- Content checks for shipped skills: paths, language, JSON templates,
  confirmation before outward-facing actions and PowerShell-unsafe arguments (#9).

### Changed

- `init` CI templates use current action versions, kept in sync with this
  repository's workflows by a test (#11).

### Removed

- Placeholder `kickstart` skill (#9).
