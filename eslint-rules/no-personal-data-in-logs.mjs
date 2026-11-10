/**
 * Fails a logger call whose context object has a key that names personal data.
 * Logs leave the process, so people are identified by account ID only.
 */

const LOG_LEVELS = new Set([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);
const LOGGER_NAMES = new Set(['logger', 'log']);
const FORBIDDEN_KEYS = new Set([
  'email',
  'to',
  'password',
  'token',
  'ip',
  'phone',
  'username',
  'fullName',
  'firstName',
  'lastName',
  'ownerName',
]);
const FORBIDDEN_SUFFIX = /(Email|Password|Token|Ip)$/;
// Pseudonymous values that merely look like personal keys.
const ALLOWED_KEYS = new Set([
  'tokenLength',
  'tokenFingerprint',
  'hasName',
  'mustChangePassword',
]);

function keyName(property) {
  if (property.type !== 'Property' || property.computed) return null;
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'Literal') return String(property.key.value);
  return null;
}

function isForbidden(name) {
  if (ALLOWED_KEYS.has(name)) return false;
  return FORBIDDEN_KEYS.has(name) || FORBIDDEN_SUFFIX.test(name);
}

function isLoggerCall(callee) {
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    LOGGER_NAMES.has(callee.object.name) &&
    callee.property.type === 'Identifier' &&
    LOG_LEVELS.has(callee.property.name)
  );
}

const noPersonalDataInLogs = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow personal data keys in logger context objects',
    },
    messages: {
      personalKey:
        'Log context key "{{name}}" names personal data. Log the account ID (userId, adminId) instead.',
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (!isLoggerCall(node.callee)) return;

        const [context_] = node.arguments;
        if (context_?.type !== 'ObjectExpression') return;

        for (const property of context_.properties) {
          const name = keyName(property);
          if (name && isForbidden(name)) {
            context.report({
              node: property,
              messageId: 'personalKey',
              data: { name },
            });
          }
        }
      },
    };
  },
};

export default noPersonalDataInLogs;
