# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial plugin structure, manifests, validation scripts and tests.
- Workflow skills `init`, `feature`, `release` and `status`, ported to English
  from the original workflow, with shared conventions and templates (#9).
- Optional `just` and Codex: detected, with fallbacks; private repositories on a
  free plan skip the settings they cannot use (#9).
- Content checks for shipped skills: paths, language, JSON templates and
  confirmation before outward-facing actions (#9).

### Removed

- Placeholder `kickstart` skill (#9).
