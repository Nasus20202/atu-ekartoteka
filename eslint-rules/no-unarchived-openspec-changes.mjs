import { readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Disallows unarchived OpenSpec changes. A change that is still listed under
 * `openspec/changes/` has not been archived yet, so the specs and the change
 * record can drift apart.
 */

const ARCHIVE_DIRECTORY = 'archive';
const CHANGES_DIRECTORY = path.join('openspec', 'changes');

/**
 * Returns the names of change directories that are not archived yet.
 * A project without `openspec/changes/` has no changes to report.
 */
export function findUnarchivedChanges(cwd) {
  let entries;

  try {
    entries = readdirSync(path.join(cwd, CHANGES_DIRECTORY), {
      withFileTypes: true,
    });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== ARCHIVE_DIRECTORY)
    .map((entry) => entry.name)
    .sort();
}

// The filesystem is read once per linted root, not once per linted file.
const changesByRoot = new Map();

function unarchivedChangesFor(cwd) {
  if (!changesByRoot.has(cwd)) {
    changesByRoot.set(cwd, findUnarchivedChanges(cwd));
  }

  return changesByRoot.get(cwd);
}

const noUnarchivedOpenspecChanges = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unarchived OpenSpec changes',
    },
    messages: {
      unarchivedChange:
        'Unarchived OpenSpec change(s): {{names}}. Archive them with `openspec archive` before finishing the work.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          root: {
            type: 'string',
            description:
              'Directory holding `openspec/`; defaults to the working directory.',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const cwd = context.cwd ?? process.cwd();
    const root = context.options[0]?.root
      ? path.resolve(cwd, context.options[0].root)
      : cwd;

    return {
      Program(node) {
        const names = unarchivedChangesFor(root);

        if (names.length > 0) {
          context.report({
            node,
            messageId: 'unarchivedChange',
            data: { names: names.join(', ') },
          });
        }
      },
    };
  },
};

export default noUnarchivedOpenspecChanges;
