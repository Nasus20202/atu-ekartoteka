import {
  findCandidatesByAddress,
  findCandidatesByExternalId,
} from '@/lib/settlements/queries/find-match-candidates';
import { matchOwner } from '@/lib/settlements/rules/owner-match';
import type {
  MatchedRecord,
  SettlementRecord,
} from '@/lib/settlements/types/prepared-file';
import { errorIssue, recordSubject } from '@/lib/settlements/validation/issues';

/** Finds the apartment record of a printed record, or states why it cannot. */
export async function matchSettlementRecord(
  entry: SettlementRecord,
  fileName: string
): Promise<MatchedRecord> {
  const apartmentLabel =
    entry.type === 'utility'
      ? entry.record.apartmentExternalId
      : entry.record.apartmentLabel;
  const candidates =
    entry.type === 'utility'
      ? await findCandidatesByExternalId(entry.record.apartmentExternalId)
      : await findCandidatesByAddress(entry.record.address);
  const match = matchOwner(entry.record.printedOwner, candidates);
  const found = 'apartment' in match;
  const reason =
    match.status === 'ambiguous'
      ? 'pasuje więcej niż jeden lokal.'
      : candidates.length === 0
        ? 'nie ma takiego lokalu.'
        : 'lokal nie ma takiego właściciela.';

  return {
    ...entry,
    apartmentLabel,
    apartment: found ? match.apartment : null,
    annotated: match.status === 'annotation',
    issues: found
      ? []
      : [
          errorIssue(
            {
              fileName,
              subject: recordSubject(apartmentLabel, entry.record),
            },
            'match',
            reason
          ),
        ],
  };
}
