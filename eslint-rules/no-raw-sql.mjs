/**
 * Disallows Prisma raw SQL in application code; it bypasses the query API and
 * belongs in migration files only.
 */

const RAW_SQL_MEMBERS = new Set([
  '$queryRaw',
  '$queryRawUnsafe',
  '$queryRawTyped',
  '$executeRaw',
  '$executeRawUnsafe',
]);

const noRawSql = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Prisma raw SQL in application code',
    },
    messages: {
      noRawSql:
        'Prisma raw SQL ({{name}}) is not allowed. Use the Prisma query API; raw SQL belongs in migration files.',
    },
    schema: [],
  },

  create(context) {
    return {
      MemberExpression(node) {
        if (node.computed || node.property.type !== 'Identifier') {
          return;
        }

        if (RAW_SQL_MEMBERS.has(node.property.name)) {
          context.report({
            node,
            messageId: 'noRawSql',
            data: { name: node.property.name },
          });
        }
      },
    };
  },
};

export default noRawSql;
