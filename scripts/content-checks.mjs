#!/usr/bin/env node
// Content checks for shipped plugin content (skills/ and references/).
// No runtime dependencies. Usage: node scripts/content-checks.mjs [rootDir]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HEADING = /^#{1,6}\s+\S/;
const FENCE = /^\s*(```|~~~)/;

/**
 * Splits Markdown into sections; every heading (outside code fences) starts one.
 * Returns [{ heading, line, text }]; `heading` is null for text before the first heading.
 */
export function splitSections(markdown) {
  const sections = [];
  let current = { heading: null, line: 1, lines: [] };
  let inFence = false;
  markdown.split(/\r?\n/).forEach((lineText, index) => {
    if (FENCE.test(lineText)) inFence = !inFence;
    if (!inFence && HEADING.test(lineText)) {
      if (current.heading !== null || current.lines.some((l) => l.trim())) sections.push(current);
      current = { heading: lineText.trim(), line: index + 1, lines: [] };
    }
    current.lines.push(lineText);
  });
  if (current.heading !== null || current.lines.some((l) => l.trim())) sections.push(current);
  return sections.map(({ heading, line, lines }) => ({ heading, line, text: lines.join('\n') }));
}

const OUTWARD = [
  'git push',
  'gh repo create',
  'gh repo edit',
  'gh issue create',
  'gh issue comment',
  'gh issue develop',
  'gh pr create',
  'gh pr comment',
  'gh pr merge',
  'gh pr ready',
  'gh label create',
  'gh release create',
];
const CONFIRM = /\bconfirm/i;

/** True when a `gh api` call (text after `gh api`) can change state on GitHub. */
function isMutatingApiCall(args) {
  const method = /(?:^|\s)(?:-X|--method)[\s=]+([A-Za-z]+)/.exec(args);
  if (method) return method[1].toUpperCase() !== 'GET';
  // gh api switches to POST when fields or an input body are given.
  return /(?:^|\s)(?:-f|-F|--field|--raw-field|--input)(?:\s|=|$)/.test(args);
}

/**
 * Heuristic: every section that contains an outward-facing command must also
 * contain a confirmation instruction. It checks that the instruction is written
 * down, not that Claude follows it.
 */
export function findUnconfirmedActions(markdown, file) {
  const errors = [];
  for (const section of splitSections(markdown)) {
    if (CONFIRM.test(section.text)) continue;
    const found = OUTWARD.filter((cmd) => new RegExp(`\\b${cmd.replace(/ /g, '\\s+')}\\b`).test(section.text));
    for (const match of section.text.matchAll(/\bgh\s+api\b([^`\n]*)/g)) {
      if (isMutatingApiCall(match[1])) found.push(`gh api${match[1].trimEnd()}`);
    }
    const where = section.heading ?? '(top)';
    for (const cmd of found) {
      errors.push(`${file}:${section.line} section "${where}": \`${cmd}\` without a confirmation instruction`);
    }
  }
  return errors;
}

// Arguments PowerShell rewrites when unquoted: `@me` is splatting (the argument
// vanishes) and `{...}` starts a script block (the argument is split apart).
const PWSH_PITFALLS = [
  { test: (token) => token.startsWith('@me'), hint: 'quote "@me"' },
  { test: (token) => /\{(owner|repo)\}/.test(token), hint: 'quote paths with {owner}/{repo}' },
];

/** Reports command arguments that break in PowerShell unless quoted. */
export function findShellPitfalls(markdown, file) {
  const errors = [];
  markdown.split(/\r?\n/).forEach((line, index) => {
    for (const token of line.split(/[\s`]+/)) {
      if (!token || token.startsWith('"') || token.startsWith("'")) continue;
      const pitfall = PWSH_PITFALLS.find((p) => p.test(token));
      if (pitfall) errors.push(`${file}:${index + 1}: \`${token}\` breaks in PowerShell; ${pitfall.hint}`);
    }
  });
  return errors;
}

const SPANISH_CHARS = /[¿¡ñÑáéíóúÁÉÍÓÚ]/;
const SPANISH_WORDS = ['rama', 'ramas', 'fichero', 'ficheros', 'hecho cuando', 'punto de control', 'sigue todo'];
const SPANISH_WORD_RE = new RegExp(`\\b(${SPANISH_WORDS.map((w) => w.replace(/ /g, '\\s+')).join('|')})\\b`, 'i');

/** Reports lines that look Spanish (one error per line). */
export function findSpanish(text, file) {
  const errors = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const marker = SPANISH_CHARS.exec(line)?.[0] ?? SPANISH_WORD_RE.exec(line)?.[0];
    if (marker) errors.push(`${file}:${index + 1}: Spanish text ("${marker}") in shipped content`);
  });
  return errors;
}

const PATH_REF = /\$\{(CLAUDE_PLUGIN_ROOT|CLAUDE_SKILL_DIR)\}\/([A-Za-z0-9_./-]+)/g;

/** Reports `${CLAUDE_PLUGIN_ROOT}/…` and `${CLAUDE_SKILL_DIR}/…` paths that do not exist. */
export function findBrokenPaths(text, { pluginRoot, skillDir, file }) {
  const errors = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [, variable, rawPath] of line.matchAll(PATH_REF)) {
      const path = rawPath.replace(/[.,;:]+$/, '');
      const base = variable === 'CLAUDE_PLUGIN_ROOT' ? pluginRoot : skillDir;
      if (!base) {
        errors.push(`${file}:${index + 1}: \${${variable}} used outside a skill`);
      } else if (!existsSync(join(base, path))) {
        errors.push(`${file}:${index + 1}: \${${variable}}/${path} does not exist`);
      }
    }
  });
  return errors;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const toPosix = (path) => path.split(sep).join('/');

/** Reports every .json file under `dir` that does not parse; paths are shown relative to `base`. */
export function findInvalidJson(dir, base = dir) {
  const errors = [];
  for (const file of walk(dir).filter((f) => f.endsWith('.json'))) {
    try {
      JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      errors.push(`${toPosix(relative(base, file))}: invalid JSON (${err.message})`);
    }
  }
  return errors;
}

const TEXT_EXT = /\.(md|json|ya?ml|txt)$/;

/** Runs every content check on skills/ and references/ under `rootDir`. */
export function runContentChecks(rootDir) {
  const errors = [];
  const files = [...walk(join(rootDir, 'skills')), ...walk(join(rootDir, 'references'))];
  for (const full of files.filter((f) => TEXT_EXT.test(f))) {
    const rel = toPosix(relative(rootDir, full));
    const text = readFileSync(full, 'utf8');
    errors.push(...findSpanish(text, rel));
    if (!full.endsWith('.md')) continue;
    errors.push(...findUnconfirmedActions(text, rel));
    errors.push(...findShellPitfalls(text, rel));
    const skill = /^skills\/([^/]+)\//.exec(rel)?.[1];
    const skillDir = skill ? join(rootDir, 'skills', skill) : undefined;
    errors.push(...findBrokenPaths(text, { pluginRoot: rootDir, skillDir, file: rel }));
  }
  for (const dir of ['skills', 'references']) {
    errors.push(...findInvalidJson(join(rootDir, dir), rootDir));
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = runContentChecks(resolve(process.argv[2] ?? '.'));
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.log('✓ shipped content passes the content checks');
}
