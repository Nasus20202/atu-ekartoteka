import { formatSpan } from '@/lib/settlements/rules/format';
import { comparableText } from '@/lib/settlements/rules/normalize-text';
import type {
  MatchedRecord,
  PreparedFile,
} from '@/lib/settlements/types/prepared-file';
import { errorIssue, recordSubject } from '@/lib/settlements/validation/issues';

// Records of one apartment record; unmatched ones are told apart by their owner
const identity = ({ type, apartment, apartmentLabel, record }: MatchedRecord) =>
  JSON.stringify([
    type,
    apartment?.id ?? [apartmentLabel, comparableText(record.printedOwner)],
  ]);

/**
 * Selected files must not contain one settlement twice, nor two settlements of
 * an apartment whose periods share days.
 */
export function addBatchConflicts(files: PreparedFile[]): PreparedFile[] {
  const entries = files.flatMap((file) =>
    file.records.map((matched) => ({ file, matched, id: identity(matched) }))
  );

  return files.map((file) => ({
    ...file,
    records: file.records.map((matched) => {
      const { periodFrom, periodTo } = matched.record;
      const subject = recordSubject(matched.apartmentLabel, matched.record);
      const context = {
        fileName: file.fileName,
        apartmentExternalId: matched.apartment?.externalApartmentId,
        subject,
      };
      const conflicts = entries
        .filter(
          (other) =>
            other.matched !== matched &&
            other.id === identity(matched) &&
            other.matched.record.periodFrom <= periodTo &&
            other.matched.record.periodTo >= periodFrom
        )
        .map((other) => {
          const { record } = other.matched;
          return record.periodFrom === periodFrom &&
            record.periodTo === periodTo
            ? errorIssue(
                context,
                'duplicate',
                `to samo rozliczenie jest w pliku „${other.file.fileName}”.`
              )
            : errorIssue(
                context,
                'overlap',
                `okres nakłada się na rozliczenie ${formatSpan(record.periodFrom, record.periodTo)} z pliku „${other.file.fileName}”.`
              );
        });
      return { ...matched, issues: [...matched.issues, ...conflicts] };
    }),
  }));
}
