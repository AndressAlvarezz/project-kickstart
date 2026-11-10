# Task runner for project-kickstart. Run `just` to list recipes.
set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

default:
    @just --list

# Install development dependencies (exact versions from package-lock.json)
setup:
    npm ci

# Lint Markdown and validate plugin manifests and skills
lint:
    npx --no-install markdownlint-cli2
    node scripts/validate.mjs

# Run the test suite
test:
    node --test

# Check the plugin with the official Claude Code validator (if installed)
build:
    node scripts/validate.mjs
    node scripts/official-validate.mjs
