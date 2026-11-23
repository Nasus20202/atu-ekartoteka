/**
 * A domain slice (src/lib/<slice>/) holds only folders, and each folder is one
 * of the known slice folders. Files at the slice root have no place in the
 * layout: a reader cannot tell which layer they belong to.
 */

import {
  isTestFile,
  libPathOf,
  NON_SLICE_LIB,
  parseLibPath,
  SLICE_FOLDERS,
} from './slice-layers.mjs';

const sliceStructure = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Domain slices hold only known folders; files belong in a folder of their slice',
    },
    messages: {
      looseFile:
        'Slice roots hold only folders. Move "{{name}}" into a folder of its slice: {{folders}}.',
      unknownFolder:
        'Folder "{{folder}}" is not a slice folder. Use one of: {{folders}}.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename;
    if (isTestFile(filename)) {
      return {};
    }
    const rel = libPathOf(filename);
    if (!rel) {
      return {};
    }
    const loc = parseLibPath(rel);
    if (NON_SLICE_LIB.has(loc.slice) || loc.depth === 0) {
      return {};
    }
    const folders = SLICE_FOLDERS.join(', ');

    return {
      Program(node) {
        if (loc.isRootFile) {
          context.report({
            node,
            messageId: 'looseFile',
            data: { name: rel.split('/').pop(), folders },
          });
        } else if (!SLICE_FOLDERS.includes(loc.folder)) {
          context.report({
            node,
            messageId: 'unknownFolder',
            data: { folder: loc.folder, folders },
          });
        }
      },
    };
  },
};

export default sliceStructure;
