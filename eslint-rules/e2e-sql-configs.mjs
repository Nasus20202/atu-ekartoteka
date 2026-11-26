// E2E code loads its SQL from e2e/test-data/seed/*.sql with loadSql() instead
// of writing it inline.
const INLINE_SQL = {
  selector:
    "CallExpression[callee.property.name='query'][arguments.0.type=/^(Literal|TemplateLiteral)$/]",
  message:
    'Do not write SQL inline in e2e code. Put it in e2e/test-data/seed/*.sql and load it with loadSql().',
};

export const e2eSqlConfigs = [
  {
    files: ['e2e/**/*.ts'],
    rules: { 'no-restricted-syntax': ['error', INLINE_SQL] },
  },
];
