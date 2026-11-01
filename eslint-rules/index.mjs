import noRawSql from './no-raw-sql.mjs';
import preferAccessHelpers from './prefer-access-helpers.mjs';

const localPlugin = {
  rules: {
    'prefer-access-helpers': preferAccessHelpers,
    'no-raw-sql': noRawSql,
  },
};

export default localPlugin;
