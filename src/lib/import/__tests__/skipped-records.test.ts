import { describe, expect, it } from 'vitest';

import { buildSkippedRecordWarnings } from '@/lib/import/skipped-records';

const LEASE = { ownerId: 'N00001', apartmentId: 'HOA-STELES' };
const FORMER_OWNER = { ownerId: 'W00097', apartmentId: 'HOA-00009M' };
const OWNER = { ownerId: 'W00513', apartmentId: 'HOA-00009M' };

const apartmentMap = new Map([['W00513#HOA-00009M', 'apt-1']]);

describe('buildSkippedRecordWarnings', () => {
  it('groups non-owner records per owner and apartment with counts', () => {
    const warnings = buildSkippedRecordWarnings(apartmentMap, {
      charges: [LEASE, LEASE, OWNER],
      notifications: [LEASE],
      payments: [LEASE, OWNER],
    });

    expect(warnings).toEqual([
      {
        apartmentExternalId: 'HOA-STELES',
        message:
          'Pominięto 2 naliczenia, 1 powiadomienie, 1 wpłatę dla N00001: ' +
          'identyfikator nie oznacza właściciela (W), lokal nie jest importowany',
      },
    ]);
  });

  it('reports an owner missing from lok.txt and the database', () => {
    const warnings = buildSkippedRecordWarnings(apartmentMap, {
      payments: [FORMER_OWNER, OWNER],
    });

    expect(warnings).toEqual([
      {
        apartmentExternalId: 'HOA-00009M',
        message:
          'Pominięto 1 wpłatę dla W00097: brak właściciela w lok.txt i w bazie',
      },
    ]);
  });

  it('returns no warnings when every record matches an apartment', () => {
    expect(
      buildSkippedRecordWarnings(apartmentMap, {
        charges: [OWNER],
        payments: [OWNER],
      })
    ).toEqual([]);
  });

  it('returns no warnings without sources', () => {
    expect(buildSkippedRecordWarnings(apartmentMap, {})).toEqual([]);
  });

  it('uses the plural forms for larger counts', () => {
    const [warning] = buildSkippedRecordWarnings(apartmentMap, {
      charges: Array(10).fill(LEASE),
      payments: Array(5).fill(LEASE),
    });

    expect(warning.message).toContain('Pominięto 10 naliczeń, 5 wpłat');
  });
});
