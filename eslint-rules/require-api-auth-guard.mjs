import path from 'node:path';

/**
 * Requires every API route module to resolve the caller through a shared auth
 * guard, unless the route is explicitly public. Without this, a new route is
 * public by accident and no test notices.
 */

const API_DIRECTORY_MARKER = '/src/app/api/';
const API_DIRECTORY_PREFIX = 'src/app/api/';

const GUARD_MODULES = new Set([
  '@/lib/auth/require-user',
  '@/lib/auth/require-admin',
  '@/auth',
]);

const PUBLIC_ROUTES = new Set([
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/config/google/route.ts',
  'src/app/api/config/turnstile/route.ts',
  'src/app/api/forgot-password/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/health/liveness/route.ts',
  'src/app/api/health/readiness/route.ts',
  'src/app/api/register/route.ts',
  'src/app/api/reset-password/route.ts',
  'src/app/api/setup/check/route.ts',
  'src/app/api/verify-email/route.ts',
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
        'API route {{file}} imports no auth guard. Use requireUser()/requireAdmin(), or add the route to PUBLIC_ROUTES in eslint-rules/require-api-auth-guard.mjs if it is public.',
    },
    schema: [],
  },

  create(context) {
    const apiPath = toApiPath(context.filename);

    if (
      !apiPath ||
      !apiPath.endsWith('/route.ts') ||
      PUBLIC_ROUTES.has(apiPath)
    ) {
      return {};
    }

    let guarded = false;

    return {
      ImportDeclaration(node) {
        if (
          typeof node.source.value === 'string' &&
          GUARD_MODULES.has(node.source.value)
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
