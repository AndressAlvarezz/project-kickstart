#!/usr/bin/env node
// Runs `claude plugin validate .` when the Claude Code CLI is available.
// Set REQUIRE_CLAUDE=1 to fail instead of skipping when it is missing (used in CI).
import { spawnSync } from 'node:child_process';

const opts = { stdio: 'inherit', shell: process.platform === 'win32' };
const probe = spawnSync('claude', ['--version'], { ...opts, stdio: 'ignore' });

if (probe.status !== 0) {
  const msg = 'claude CLI not found: skipping official plugin validation';
  if (process.env.REQUIRE_CLAUDE === '1') {
    console.error(`✗ ${msg}`);
    process.exit(1);
  }
  console.warn(`! ${msg}`);
  process.exit(0);
}

const result = spawnSync('claude', ['plugin', 'validate', '.'], opts);
process.exit(result.status ?? 1);
