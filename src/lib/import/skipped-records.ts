import type { ImportWarning } from '@/lib/import/types';
import { isOwnerId } from '@/lib/parsers/owner-id';
import {
  CHARGE_FORMS,
  formatCountPl,
  type PolishPluralForms,
} from '@/lib/utils/pluralize';

const NOTIFICATION_FORMS: PolishPluralForms = {
  one: 'powiadomienie',
  few: 'powiadomienia',
  many: 'powiadomień',
};
const PAYMENT_FORMS: PolishPluralForms = {
  one: 'wpłatę',
  few: 'wpłaty',
  many: 'wpłat',
};

const RECORD_KINDS = [
  { key: 'charges', forms: CHARGE_FORMS },
  { key: 'notifications', forms: NOTIFICATION_FORMS },
  { key: 'payments', forms: PAYMENT_FORMS },
] as const;

type RecordKind = (typeof RECORD_KINDS)[number]['key'];

export interface RecordRef {
  ownerId: string;
  apartmentId: string;
}

export type SkippedRecordSources = Partial<Record<RecordKind, RecordRef[]>>;

interface SkippedGroup extends RecordRef {
  counts: Record<RecordKind, number>;
}

function describeReason(ownerId: string): string {
  return isOwnerId(ownerId)
    ? 'brak właściciela w lok.txt i w bazie'
    : 'identyfikator nie oznacza właściciela (W), lokal nie jest importowany';
}

/** One warning per owner#apartment whose rows had no imported apartment. */
export function buildSkippedRecordWarnings(
  apartmentMap: Map<string, string>,
  sources: SkippedRecordSources
): ImportWarning[] {
  const groups = new Map<string, SkippedGroup>();

  for (const { key: kind } of RECORD_KINDS) {
    for (const { ownerId, apartmentId } of sources[kind] ?? []) {
      const key = `${ownerId}#${apartmentId}`;
      if (apartmentMap.has(key)) continue;

      const group = groups.get(key) ?? {
        ownerId,
        apartmentId,
        counts: { charges: 0, notifications: 0, payments: 0 },
      };
      group.counts[kind]++;
      groups.set(key, group);
    }
  }

  return Array.from(groups.values()).map(({ ownerId, apartmentId, counts }) => {
    const skipped = RECORD_KINDS.filter(({ key }) => counts[key] > 0)
      .map(({ key, forms }) => formatCountPl(counts[key], forms))
      .join(', ');

    return {
      kind: 'skipped-records',
      apartmentExternalId: apartmentId,
      message: `Pominięto ${skipped} dla ${ownerId}: ${describeReason(ownerId)}`,
    };
  });
}
