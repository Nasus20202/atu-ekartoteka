/**
 * Requires the shared access predicates instead of comparing account status or
 * role directly, so the access rule lives in one place.
 */

const ACCESS_CHECKS = {
  status: {
    enumName: 'AccountStatus',
    enumValue: 'APPROVED',
    helper:
      'isApprovedStatus() / isApprovedAccount() from @/lib/auth/account-access',
  },
  role: {
    enumName: 'UserRole',
    enumValue: 'ADMIN',
    helper: 'isAdminRole() / isApprovedAdmin() from @/lib/auth/admin-access',
  },
};

const COMPARISON_OPERATORS = new Set(['===', '!==', '==', '!=']);

/** Object chains that describe the signed-in account rather than arbitrary data. */
const ACCOUNT_OBJECT_PATTERN = /(user|session|account|profile)/i;

const UNWRAP_NODES = new Set([
  'ChainExpression',
  'ParenthesizedExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
]);

function unwrap(node) {
  let current = node;

  while (current && UNWRAP_NODES.has(current.type)) {
    current = current.expression;
  }

  return current;
}

function memberPropertyName(node) {
  const expression = unwrap(node);

  if (
    !expression ||
    expression.type !== 'MemberExpression' ||
    expression.computed
  ) {
    return null;
  }

  return expression.property.type === 'Identifier'
    ? expression.property.name
    : null;
}

/** A bare `status` / `role` variable is the same check as `user.status`. */
function accessProperty(node) {
  const expression = unwrap(node);

  if (!expression) {
    return null;
  }

  if (expression.type === 'Identifier') {
    return Object.hasOwn(ACCESS_CHECKS, expression.name)
      ? expression.name
      : null;
  }

  const property = memberPropertyName(expression);

  return property && Object.hasOwn(ACCESS_CHECKS, property) ? property : null;
}

function rootObjectName(node) {
  let current = unwrap(node);

  while (current && current.type === 'MemberExpression') {
    current = unwrap(current.object);
  }

  return current && current.type === 'Identifier' ? current.name : null;
}

function isEnumMember(node, enumName, enumValue) {
  const expression = unwrap(node);

  if (
    !expression ||
    expression.type !== 'MemberExpression' ||
    expression.computed
  ) {
    return false;
  }

  return (
    expression.object.type === 'Identifier' &&
    expression.object.name === enumName &&
    expression.property.type === 'Identifier' &&
    expression.property.name === enumValue
  );
}

function isEnumLiteral(node, enumValue, memberSide) {
  const expression = unwrap(node);

  if (!expression || expression.type !== 'Literal') {
    return false;
  }

  return (
    expression.value === enumValue &&
    ACCOUNT_OBJECT_PATTERN.test(rootObjectName(memberSide) ?? '')
  );
}

const preferAccessHelpers = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require the shared access predicates instead of comparing account status or role directly',
    },
    messages: {
      preferAccessHelper:
        'Do not compare {{property}} directly. Use {{helper}} so the access rule stays in one place.',
    },
    schema: [],
  },

  create(context) {
    return {
      BinaryExpression(node) {
        if (!COMPARISON_OPERATORS.has(node.operator)) {
          return;
        }

        for (const [member, value] of [
          [node.left, node.right],
          [node.right, node.left],
        ]) {
          const property = accessProperty(member);
          const check = property && ACCESS_CHECKS[property];

          if (!check) {
            continue;
          }

          if (
            isEnumMember(value, check.enumName, check.enumValue) ||
            isEnumLiteral(value, check.enumValue, member)
          ) {
            context.report({
              node,
              messageId: 'preferAccessHelper',
              data: { property, helper: check.helper },
            });
            return;
          }
        }
      },
    };
  },
};

export default preferAccessHelpers;
