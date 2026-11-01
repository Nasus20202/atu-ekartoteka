import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { RuleTester } from 'eslint';

import localRules from '../index.mjs';
import { findUnarchivedChanges } from '../no-unarchived-openspec-changes.mjs';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

function createRoot(prefix, changes) {
  const root = mkdtempSync(path.join(tmpdir(), prefix));

  for (const change of changes) {
    mkdirSync(path.join(root, 'openspec', 'changes', change), {
      recursive: true,
    });
  }

  return root;
}

const ARCHIVED_ROOT = createRoot('openspec-archived-', [
  path.join('archive', '2026-01-01-old'),
]);
const UNARCHIVED_ROOT = createRoot('openspec-open-', [
  'beta',
  'alpha',
  path.join('archive', '2026-01-01-old'),
]);
const EMPTY_ROOT = mkdtempSync(path.join(tmpdir(), 'openspec-empty-'));

afterAll(() => {
  for (const root of [ARCHIVED_ROOT, UNARCHIVED_ROOT, EMPTY_ROOT]) {
    rmSync(root, { recursive: true, force: true });
  }
});

ruleTester.run(
  'no-unarchived-openspec-changes',
  localRules.rules['no-unarchived-openspec-changes'],
  {
    valid: [
      'const value = 1;',
      { code: 'const value = 1;', options: [{ root: ARCHIVED_ROOT }] },
      { code: 'const value = 1;', options: [{ root: EMPTY_ROOT }] },
    ],

    invalid: [
      {
        code: 'const value = 1;',
        options: [{ root: UNARCHIVED_ROOT }],
        errors: [
          { messageId: 'unarchivedChange', data: { names: 'alpha, beta' } },
        ],
      },
    ],
  }
);

describe('findUnarchivedChanges', () => {
  it('ignores archived changes', () => {
    expect(findUnarchivedChanges(ARCHIVED_ROOT)).toEqual([]);
  });

  it('returns unarchived change names sorted', () => {
    expect(findUnarchivedChanges(UNARCHIVED_ROOT)).toEqual(['alpha', 'beta']);
  });

  it('returns nothing when the project has no openspec directory', () => {
    expect(findUnarchivedChanges(EMPTY_ROOT)).toEqual([]);
  });
});
