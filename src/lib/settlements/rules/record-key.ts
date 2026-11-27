import { createHash } from 'node:crypto';

import { canonicalContent } from '@/lib/settlements/rules/record-content';
import type { MatchedRecord } from '@/lib/settlements/types/prepared-file';

/**
 * Binds an admin's confirmation to what was previewed: another apartment,
 * period or content gives another key.
 */
export function recordKey({
  type,
  record,
  apartment,
  apartmentLabel,
}: MatchedRecord): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        type,
        apartment?.id ?? apartmentLabel,
        canonicalContent(record),
      ])
    )
    .digest('hex');
}
