import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseFrontmatter, validatePlugin } from '../scripts/validate.mjs';

const repoRoot = resolve(import.meta.dirname, '..');

function makeFixture({ pluginVersion = '1.0.0', marketVersion = '1.0.0', skillName = 'demo', extraFrontmatter = '' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'kickstart-'));
  mkdirSync(join(dir, '.claude-plugin'));
  mkdirSync(join(dir, 'skills', 'demo'), { recursive: true });
  writeFileSync(
    join(dir, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'demo-plugin', version: pluginVersion, description: 'Demo' }),
  );
  writeFileSync(
    join(dir, '.claude-plugin', 'marketplace.json'),
    JSON.stringify({
      name: 'demo-market',
      owner: { name: 'Tester' },
      plugins: [{ name: 'demo-plugin', source: './', version: marketVersion }],
    }),
  );
  writeFileSync(
    join(dir, 'skills', 'demo', 'SKILL.md'),
    `---\nname: ${skillName}\ndescription: A demo skill\n${extraFrontmatter}---\n\n# Demo\n`,
  );
  return dir;
}

test('the repository plugin is valid', () => {
  assert.deepEqual(validatePlugin(repoRoot), []);
});

test('parseFrontmatter reads key/value pairs and strips quotes', () => {
  const fm = parseFrontmatter('---\r\nname: "demo"\r\ndescription: Hello world\r\n---\r\nbody');
  assert.deepEqual(fm, { name: 'demo', description: 'Hello world' });
});

test('parseFrontmatter returns null without frontmatter', () => {
  assert.equal(parseFrontmatter('# No frontmatter'), null);
});

test('a well-formed fixture passes', (t) => {
  const dir = makeFixture();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(validatePlugin(dir), []);
});

test('detects version mismatch between manifests', (t) => {
  const dir = makeFixture({ marketVersion: '2.0.0' });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.match(validatePlugin(dir).join('\n'), /version mismatch/);
});

test('detects skill name that does not match its directory', (t) => {
  const dir = makeFixture({ skillName: 'other' });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.match(validatePlugin(dir).join('\n'), /must equal the directory name/);
});

test('detects missing manifests', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'kickstart-empty-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const errors = validatePlugin(dir).join('\n');
  assert.match(errors, /missing file: .*plugin\.json/);
  assert.match(errors, /missing directory: skills/);
});

test('accepts argument-hint and boolean disable-model-invocation', (t) => {
  const dir = makeFixture({ extraFrontmatter: 'argument-hint: <name>\ndisable-model-invocation: true\n' });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(validatePlugin(dir), []);
});

test('rejects a non-boolean disable-model-invocation', (t) => {
  const dir = makeFixture({ extraFrontmatter: 'disable-model-invocation: yes\n' });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.match(validatePlugin(dir).join('\n'), /"disable-model-invocation" must be true or false/);
});

test('rejects an empty argument-hint', (t) => {
  const dir = makeFixture({ extraFrontmatter: 'argument-hint:\n' });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.match(validatePlugin(dir).join('\n'), /"argument-hint" must be a non-empty string/);
});
