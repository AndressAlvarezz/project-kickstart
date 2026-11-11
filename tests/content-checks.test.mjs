import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseFrontmatter } from '../scripts/validate.mjs';
import {
  splitSections,
  findUnconfirmedActions,
  findSpanish,
  findBrokenPaths,
  findInvalidJson,
  findShellPitfalls,
  runContentChecks,
} from '../scripts/content-checks.mjs';

const repoRoot = resolve(import.meta.dirname, '..');
const skillsDir = join(repoRoot, 'skills');

function skillNames() {
  return readdirSync(skillsDir)
    .filter((d) => statSync(join(skillsDir, d)).isDirectory())
    .sort();
}

function frontmatterOf(name) {
  return parseFrontmatter(readFileSync(join(skillsDir, name, 'SKILL.md'), 'utf8'));
}

// --- Repository content -----------------------------------------------------

test('the plugin exposes exactly the init, feature, release and status skills', () => {
  assert.deepEqual(skillNames(), ['feature', 'init', 'release', 'status']);
});

test('init, feature and release are user-invoked only; status is model-invocable', () => {
  for (const name of ['init', 'feature', 'release']) {
    assert.equal(frontmatterOf(name)['disable-model-invocation'], 'true', `${name} must disable model invocation`);
  }
  assert.notEqual(frontmatterOf('status')['disable-model-invocation'], 'true');
});

test('feature declares an argument hint', () => {
  assert.ok(frontmatterOf('feature')['argument-hint'], 'feature needs argument-hint');
});

test('the repository passes every content check', () => {
  assert.deepEqual(runContentChecks(repoRoot), []);
});

test('feature stops on a dirty tree and never pops a stash on the new branch', () => {
  const text = readFileSync(join(skillsDir, 'feature', 'SKILL.md'), 'utf8');
  assert.match(text, /uncommitted/i, 'feature must handle uncommitted changes');
  for (const line of text.split(/\r?\n/).filter((l) => l.includes('git stash pop'))) {
    assert.match(line, /git switch/, `stash pop must only appear as a restore on the previous branch: ${line}`);
  }
});

// --- splitSections ----------------------------------------------------------

test('splitSections starts a section at each heading, ignoring # inside code fences', () => {
  const md = ['intro', '## A', 'a', '```bash', '# not a heading', '```', '### B', 'b'].join('\n');
  const sections = splitSections(md);
  assert.deepEqual(
    sections.map((s) => s.heading),
    [null, '## A', '### B'],
  );
  assert.equal(sections[1].line, 2);
  assert.match(sections[1].text, /# not a heading/);
});

// --- findUnconfirmedActions -------------------------------------------------

test('an action confirmed in its own section passes', () => {
  const md = '## Push\nAsk the user to confirm, then run `git push -u origin HEAD`.\n';
  assert.deepEqual(findUnconfirmedActions(md, 'x.md'), []);
});

test('a confirmation in another section does not cover an action', () => {
  const md = '## Create\nConfirm before `gh repo create`.\n\n## Push\nRun `git push`.\n';
  const errors = findUnconfirmedActions(md, 'x.md');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /x\.md:4.*git push/);
});

for (const cmd of ['gh issue create', 'gh pr create', 'gh pr comment', 'gh pr merge', 'gh label create']) {
  test(`unconfirmed \`${cmd}\` is reported`, () => {
    const md = `## Step\nRun \`${cmd} --body-file body.md\`.\n`;
    assert.equal(findUnconfirmedActions(md, 'x.md').length, 1);
  });
}

test('read-only gh api calls need no confirmation', () => {
  const md = '## Check\nRun `gh api repos/{owner}/{repo} -q .private` and `gh api -X GET user`.\n';
  assert.deepEqual(findUnconfirmedActions(md, 'x.md'), []);
});

test('gh api with a mutating method or fields needs confirmation', () => {
  for (const call of ['gh api -X PUT repos/o/r', 'gh api --method POST repos/o/r/rulesets', 'gh api repos/o/r -f name=x']) {
    assert.equal(findUnconfirmedActions(`## S\nRun \`${call}\`.\n`, 'x.md').length, 1, call);
  }
});

// --- findShellPitfalls ------------------------------------------------------

test('findShellPitfalls reports unquoted @me and {owner}/{repo} paths', () => {
  const md = 'Run `gh issue list --assignee @me`.\nThen `gh api repos/{owner}/{repo}/rulesets`.\n';
  const errors = findShellPitfalls(md, 'x.md');
  assert.equal(errors.length, 2);
  assert.match(errors[0], /x\.md:1.*@me/);
  assert.match(errors[1], /x\.md:2.*\{owner\}/);
});

test('findShellPitfalls accepts quoted arguments', () => {
  const md = 'Run `gh issue list --assignee "@me"` and `gh api -X PUT \'repos/{owner}/{repo}/x\'`.\n';
  assert.deepEqual(findShellPitfalls(md, 'x.md'), []);
});

// --- findSpanish ------------------------------------------------------------

test('findSpanish reports Spanish characters and words with file and line', () => {
  const errors = findSpanish('Hello\n¿Listo?\nCreate the rama\nhecho cuando', 'x.md');
  assert.equal(errors.length, 3);
  assert.match(errors[0], /x\.md:2/);
  assert.match(errors[1], /x\.md:3/);
  assert.match(errors[2], /x\.md:4/);
});

test('findSpanish ignores English words that contain Spanish markers', () => {
  assert.deepEqual(findSpanish('Use the dramatic framework.', 'x.md'), []);
});

// --- findBrokenPaths ----------------------------------------------------------

test('findBrokenPaths resolves plugin-root and skill-dir references', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'kickstart-paths-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'references'));
  mkdirSync(join(root, 'skills', 'demo', 'templates'), { recursive: true });
  writeFileSync(join(root, 'references', 'conventions.md'), '# C\n');
  writeFileSync(join(root, 'skills', 'demo', 'templates', 'plan.md'), '# P\n');
  const skillDir = join(root, 'skills', 'demo');

  const ok = 'Read `${CLAUDE_PLUGIN_ROOT}/references/conventions.md` and `${CLAUDE_SKILL_DIR}/templates/plan.md`.';
  assert.deepEqual(findBrokenPaths(ok, { pluginRoot: root, skillDir, file: 'SKILL.md' }), []);

  const bad = 'Read `${CLAUDE_SKILL_DIR}/templates/missing.md`.';
  const errors = findBrokenPaths(bad, { pluginRoot: root, skillDir, file: 'SKILL.md' });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /missing\.md/);
});

// --- findInvalidJson ----------------------------------------------------------

test('findInvalidJson reports JSON templates that do not parse', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'kickstart-json-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'good.json'), '{"a": 1}');
  writeFileSync(join(dir, 'bad.json'), '{"a": }');
  const errors = findInvalidJson(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /bad\.json/);
});
