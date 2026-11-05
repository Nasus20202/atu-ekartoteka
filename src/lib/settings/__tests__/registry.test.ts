import { describe, expect, it } from 'vitest';

import {
  getDefaultAppSettings,
  parseAppSettingsUpdate,
} from '@/lib/settings/registry';

describe('getDefaultAppSettings', () => {
  it('returns every setting at its default', () => {
    expect(getDefaultAppSettings()).toEqual({ tenantHistoryYearsBack: 2 });
  });
});

describe('parseAppSettingsUpdate', () => {
  it('accepts a valid partial update', () => {
    expect(parseAppSettingsUpdate({ tenantHistoryYearsBack: 1 })).toEqual({
      tenantHistoryYearsBack: 1,
    });
  });

  it.each([
    ['an empty object', {}],
    ['an unknown key', { unknown: 1 }],
    ['an inherited key', { toString: 1 }],
    ['an invalid value', { tenantHistoryYearsBack: 21 }],
    ['null', null],
    ['an array', []],
  ])('rejects %s', (_, body) => {
    expect(parseAppSettingsUpdate(body)).toBeNull();
  });
});
