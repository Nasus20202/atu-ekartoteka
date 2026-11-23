/**
 * Cross-imports between the layers of a domain slice follow the matrix in
 * slice-layers.mjs. Each import is checked by the folder of the importing file
 * and the folder of the target: a model cannot import a use case, a rule cannot
 * import a query, and the framework is never imported by domain code.
 */

import {
  ALLOWED_IMPORTS,
  COMPONENT_FORBIDDEN_FOLDERS,
  importerOf,
  NON_SLICE_LIB,
  parseLibPath,
  PURE_FOLDERS,
  SHARED_ALLOWED_FOLDERS,
  SLICE_FOLDERS,
} from './slice-layers.mjs';

const LIB_PREFIX = '@/lib/';

function reasonFor(importer, source) {
  if (!source.startsWith(LIB_PREFIX)) {
    return null;
  }
  const target = parseLibPath(source.slice(LIB_PREFIX.length));
  const isSlice = SLICE_FOLDERS.includes(importer.kind);

  if (NON_SLICE_LIB.has(target.slice)) {
    if (target.slice === 'framework' && isSlice) {
      return { messageId: 'framework' };
    }
    // Logging is cross-cutting: it does no database or network I/O.
    if (
      target.slice === 'platform' &&
      target.folder !== 'logging' &&
      PURE_FOLDERS.has(importer.kind)
    ) {
      return { messageId: 'platform', data: { importer: importer.kind } };
    }
    return null;
  }

  if (target.isRootFile) {
    return { messageId: 'rootFile' };
  }

  if (importer.kind === 'components') {
    return COMPONENT_FORBIDDEN_FOLDERS.includes(target.folder)
      ? { messageId: 'components', data: { target: target.folder } }
      : null;
  }

  if (importer.kind === 'shared') {
    return SHARED_ALLOWED_FOLDERS.includes(target.folder)
      ? null
      : { messageId: 'shared' };
  }

  const allowed = ALLOWED_IMPORTS[importer.kind];
  if (allowed && !allowed.includes(target.folder)) {
    return {
      messageId: 'layer',
      data: {
        importer: importer.kind,
        target: target.folder,
        allowed: allowed.join(', '),
      },
    };
  }
  return null;
}

const MESSAGES = {
  rootFile:
    'Import from a folder of the slice, not from its root ({{source}}). Slice roots hold only folders.',
  framework:
    'Domain code must not import the framework ({{source}}). Framework glue lives in src/lib/framework/.',
  platform:
    'Pure code ({{importer}}) must not import infrastructure ({{source}}). Rules, models and validation do no I/O.',
  components:
    'Components must not import {{target}} ({{source}}). Writes go through a Server Action; orchestration runs in use cases.',
  shared:
    'Shared code may import only domain types ({{source}}). Behaviour belongs in a slice.',
  layer:
    '{{importer}} code must not import {{target}} ({{source}}). It may import: {{allowed}}.',
};

const sliceImports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce the layer matrix between folders of a domain slice and between slices',
    },
    messages: MESSAGES,
    schema: [],
  },

  create(context) {
    const importer = importerOf(context.filename);
    if (!importer) {
      return {};
    }

    const check = (node, source) => {
      if (typeof source !== 'string') {
        return;
      }
      const violation = reasonFor(importer, source);
      if (violation) {
        context.report({
          node,
          messageId: violation.messageId,
          data: { source, ...violation.data },
        });
      }
    };

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          check(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') {
          check(node, node.source.value);
        }
      },
    };
  },
};

export default sliceImports;
