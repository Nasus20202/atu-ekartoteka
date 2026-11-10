import { describe, expect, it } from 'vitest';

import { parseAppSettingsUpdate } from '@/lib/settings/registry';

describe('parseAppSettingsUpdate', () => {
  it('accepts a valid partial update', () => {
    expect(parseAppSettingsUpdate({ tenantHistoryYearsBack: 1 })).toEqual({
      ok: true,
      values: { tenantHistoryYearsBack: 1 },
    });
  });

  it('accepts a policy text and maps an empty one to null', () => {
    expect(parseAppSettingsUpdate({ privacyPolicy: ' Tekst ' })).toEqual({
      ok: true,
      values: { privacyPolicy: 'Tekst' },
    });
    expect(parseAppSettingsUpdate({ privacyPolicy: '   ' })).toEqual({
      ok: true,
      values: { privacyPolicy: null },
    });
  });

  it('accepts several settings at once', () => {
    expect(
      parseAppSettingsUpdate({ tenantHistoryYearsBack: 3, privacyPolicy: 'x' })
    ).toEqual({
      ok: true,
      values: { tenantHistoryYearsBack: 3, privacyPolicy: 'x' },
    });
  });

  it.each([
    ['an empty object', {}],
    ['an unknown key', { unknown: 1 }],
    ['an inherited key', { toString: 1 }],
    ['an invalid value', { tenantHistoryYearsBack: 21 }],
    ['a policy that is not text', { privacyPolicy: 5 }],
    ['null', null],
    ['an array', []],
  ])('rejects %s', (_, body) => {
    expect(parseAppSettingsUpdate(body)).toEqual({
      ok: false,
      message: undefined,
    });
  });

  it('carries the message of the failing setting', () => {
    const result = parseAppSettingsUpdate({
      privacyPolicy: 'Nazwa: [[firma]]',
    });

    expect(result).toEqual({
      ok: false,
      message: expect.stringContaining('[[…]]'),
    });
  });
});
