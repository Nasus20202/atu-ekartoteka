/**
 * Server Actions are public POST endpoints, so a `'use server'` module must
 * resolve the caller through a shared guard, the way API routes do. Actions are
 * also module-level only: an inline action captures variables, which Next
 * encrypts with a per-build key that every replica would have to share.
 */

const GUARD_MODULE = '@/lib/auth/require-action';
const GUARD_NAMES = new Set(['requireUserAction', 'requireAdminAction']);

function isUseServer(statement) {
  return (
    statement.type === 'ExpressionStatement' &&
    statement.directive === 'use server'
  );
}

const requireActionAuthGuard = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Require 'use server' modules to call an action auth guard and forbid inline Server Actions",
    },
    messages: {
      missingGuard:
        "Server Action module never calls requireUserAction()/requireAdminAction() from '@/lib/auth/require-action'. Add the guard call, or disable this rule for the file with a reason (/* eslint-disable local/require-action-auth-guard -- reason */) if it is intentionally public.",
      inlineAction:
        "Inline Server Actions capture variables. Move the action to a module-level 'use server' file and pass explicit arguments.",
    },
    schema: [],
  },

  create(context) {
    const guardNames = new Set();
    let guarded = false;
    let moduleAction = false;

    function checkInline(node) {
      if (
        node.body.type === 'BlockStatement' &&
        node.body.body.some(isUseServer)
      ) {
        context.report({ node, messageId: 'inlineAction' });
      }
    }

    return {
      Program(node) {
        moduleAction = node.body.some(isUseServer);
      },
      ImportDeclaration(node) {
        if (node.source.value !== GUARD_MODULE) return;

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            GUARD_NAMES.has(specifier.imported.name)
          ) {
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
      FunctionDeclaration: checkInline,
      FunctionExpression: checkInline,
      ArrowFunctionExpression: checkInline,
      'Program:exit'(node) {
        if (moduleAction && !guarded) {
          context.report({ node, messageId: 'missingGuard' });
        }
      },
    };
  },
};

export default requireActionAuthGuard;
