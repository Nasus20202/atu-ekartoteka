import path from 'node:path';

/**
 * Requires every API route module to resolve the caller through a shared auth
 * guard, unless the route is explicitly public. Without this, a new route is
 * public by accident and no test notices.
 *
 * The guard must be imported *and* called: importing `auth` straight from
 * `@/auth` is not enough, because the route can still forget to inspect the
 * session.
 */

const API_DIRECTORY_MARKER = '/src/app/api/';
const API_DIRECTORY_PREFIX = 'src/app/api/';

const GUARD_MODULES = new Set([
  '@/lib/auth/require-user',
  '@/lib/auth/require-admin',
]);

function toApiPath(filename) {
  const normalized = filename.split(path.sep).join('/');

  if (normalized.startsWith(API_DIRECTORY_PREFIX)) {
    return normalized;
  }

  const index = normalized.lastIndexOf(API_DIRECTORY_MARKER);

  return index === -1 ? null : normalized.slice(index + 1);
}

const requireApiAuthGuard = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require API route modules to use a shared authentication guard or be listed as public',
    },
    messages: {
      missingGuard:
        'API route {{file}} never calls requireUser()/requireAdmin(). Add the guard call, or disable this rule for the file with a reason (/* eslint-disable local/require-api-auth-guard -- reason */) if it is public.',
    },
    schema: [],
  },

  create(context) {
    const apiPath = toApiPath(context.filename);

    if (!apiPath || !apiPath.endsWith('/route.ts')) {
      return {};
    }

    const guardNames = new Set();
    let guarded = false;

    return {
      ImportDeclaration(node) {
        if (
          typeof node.source.value !== 'string' ||
          !GUARD_MODULES.has(node.source.value)
        ) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            guardNames.add(specifier.local.name);
          }
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          guardNames.has(node.callee.name)
        ) {
          guarded = true;
        }
      },
      'Program:exit'(node) {
        if (!guarded) {
          context.report({
            node,
            messageId: 'missingGuard',
            data: { file: apiPath },
          });
        }
      },
    };
  },
};

export default requireApiAuthGuard;
