#!/usr/bin/env node
// Validates the plugin manifests and skills. No runtime dependencies.
// Usage: node scripts/validate.mjs [rootDir]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
const MAX_DESCRIPTION = 1024;

/** Parses a minimal YAML frontmatter block (`key: value` lines only). */
export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(text);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return data;
}

function readJson(path, errors) {
  if (!existsSync(path)) {
    errors.push(`missing file: ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    errors.push(`invalid JSON in ${path}: ${err.message}`);
    return null;
  }
}

/** Returns a list of human-readable errors; empty means the plugin is valid. */
export function validatePlugin(rootDir) {
  const errors = [];
  const pluginPath = join(rootDir, '.claude-plugin', 'plugin.json');
  const marketPath = join(rootDir, '.claude-plugin', 'marketplace.json');

  const plugin = readJson(pluginPath, errors);
  if (plugin) {
    if (!KEBAB.test(plugin.name ?? '')) errors.push('plugin.json: "name" must be kebab-case');
    if (!SEMVER.test(plugin.version ?? '')) errors.push('plugin.json: "version" must be semver');
    if (!plugin.description) errors.push('plugin.json: "description" is required');
  }

  const market = readJson(marketPath, errors);
  if (market) {
    if (!KEBAB.test(market.name ?? '')) errors.push('marketplace.json: "name" must be kebab-case');
    if (!market.owner?.name) errors.push('marketplace.json: "owner.name" is required');
    if (!Array.isArray(market.plugins) || market.plugins.length === 0) {
      errors.push('marketplace.json: "plugins" must be a non-empty array');
    } else if (plugin) {
      const entry = market.plugins.find((p) => p.name === plugin.name);
      if (!entry) errors.push(`marketplace.json: no entry for plugin "${plugin.name}"`);
      else if (entry.version && entry.version !== plugin.version) {
        errors.push(`version mismatch: plugin.json ${plugin.version} vs marketplace.json ${entry.version}`);
      }
    }
  }

  const skillsDir = join(rootDir, 'skills');
  if (!existsSync(skillsDir)) {
    errors.push('missing directory: skills/');
    return errors;
  }
  const skillDirs = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory());
  if (skillDirs.length === 0) errors.push('skills/: no skills found');
  for (const dir of skillDirs) {
    const file = join(skillsDir, dir, 'SKILL.md');
    if (!existsSync(file)) {
      errors.push(`skills/${dir}: missing SKILL.md`);
      continue;
    }
    const fm = parseFrontmatter(readFileSync(file, 'utf8'));
    if (!fm) {
      errors.push(`skills/${dir}/SKILL.md: missing frontmatter`);
      continue;
    }
    if (fm.name !== dir) errors.push(`skills/${dir}/SKILL.md: "name" must equal the directory name`);
    if (!KEBAB.test(fm.name ?? '')) errors.push(`skills/${dir}/SKILL.md: "name" must be kebab-case`);
    if (!fm.description) errors.push(`skills/${dir}/SKILL.md: "description" is required`);
    else if (fm.description.length > MAX_DESCRIPTION) {
      errors.push(`skills/${dir}/SKILL.md: "description" exceeds ${MAX_DESCRIPTION} characters`);
    }
    if ('disable-model-invocation' in fm && !['true', 'false'].includes(fm['disable-model-invocation'])) {
      errors.push(`skills/${dir}/SKILL.md: "disable-model-invocation" must be true or false`);
    }
    if ('argument-hint' in fm && !fm['argument-hint']) {
      errors.push(`skills/${dir}/SKILL.md: "argument-hint" must be a non-empty string`);
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? '.');
  const errors = validatePlugin(root);
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.log('✓ plugin manifests and skills are valid');
}
