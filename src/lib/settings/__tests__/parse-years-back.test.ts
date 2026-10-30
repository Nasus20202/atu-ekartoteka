import { describe, expect, it } from 'vitest';

import { MAX_TENANT_HISTORY_YEARS_BACK } from '@/lib/settings/constants';
import { parseYearsBack } from '@/lib/settings/parse-years-back';

describe('parseYearsBack', () => {
  it.each([0, 2, MAX_TENANT_HISTORY_YEARS_BACK])('accepts %s', (value) => {
    expect(parseYearsBack(value)).toBe(value);
  });

  it.each([-1, MAX_TENANT_HISTORY_YEARS_BACK + 1, 1.5, '2', null, undefined])(
    'rejects %s',
    (value) => {
      expect(parseYearsBack(value)).toBeNull();
    }
  );
});
