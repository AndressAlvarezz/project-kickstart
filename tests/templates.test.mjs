import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');

/** Maps each `uses: <action>@<version>` in the .yml files of `dir` to its versions. */
function actionVersions(dir) {
  const versions = new Map();
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
    for (const [, action, version] of readFileSync(join(dir, name), 'utf8').matchAll(/uses:\s*([\w.-]+\/[\w.-]+)@(\S+)/g)) {
      versions.set(action, [...(versions.get(action) ?? []), `${version} (${name})`]);
    }
  }
  return versions;
}

// Dependabot updates .github/workflows/ but not the templates init ships.
test('init templates use the same action versions as this repository', () => {
  const repo = actionVersions(join(repoRoot, '.github', 'workflows'));
  const templates = actionVersions(join(repoRoot, 'skills', 'init', 'templates'));
  assert.ok(templates.size > 0, 'no actions found in templates');
  for (const [action, used] of templates) {
    if (!repo.has(action)) continue;
    const expected = repo.get(action)[0].split(' ')[0];
    for (const entry of used) {
      assert.equal(entry.split(' ')[0], expected, `${action}: template ${entry}, repository ${expected}`);
    }
  }
});
