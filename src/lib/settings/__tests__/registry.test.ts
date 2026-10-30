import { describe, expect, it } from 'vitest';

import {
  parseAppSettingsUpdate,
  resolveAppSettings,
} from '@/lib/settings/registry';

describe('resolveAppSettings', () => {
  it('uses defaults when nothing is stored', () => {
    expect(resolveAppSettings([])).toEqual({ tenantHistoryYearsBack: 2 });
  });

  it('uses stored values', () => {
    expect(
      resolveAppSettings([{ key: 'tenantHistoryYearsBack', value: 4 }])
    ).toEqual({ tenantHistoryYearsBack: 4 });
  });

  it('falls back to the default for an invalid stored value', () => {
    expect(
      resolveAppSettings([{ key: 'tenantHistoryYearsBack', value: 'x' }])
    ).toEqual({ tenantHistoryYearsBack: 2 });
  });

  it('ignores rows for keys no longer in the registry', () => {
    expect(resolveAppSettings([{ key: 'removedSetting', value: 1 }])).toEqual({
      tenantHistoryYearsBack: 2,
    });
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
