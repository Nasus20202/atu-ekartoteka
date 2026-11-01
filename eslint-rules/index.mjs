import noRawSql from './no-raw-sql.mjs';
import noUnarchivedOpenspecChanges from './no-unarchived-openspec-changes.mjs';
import preferAccessHelpers from './prefer-access-helpers.mjs';

const localPlugin = {
  rules: {
    'prefer-access-helpers': preferAccessHelpers,
    'no-raw-sql': noRawSql,
    'no-unarchived-openspec-changes': noUnarchivedOpenspecChanges,
  },
};

export default localPlugin;
