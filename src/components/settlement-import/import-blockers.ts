import type {
  SettlementConfirmation,
  SettlementPreviewFileDto,
} from '@/lib/settlements/dto/settlement-import-dto';

export interface ImportBlocker {
  fileName: string;
  errors: number;
  /** Confirmations of a file without errors that are not ticked yet */
  missing: number;
}

/** The previewed files that an import would not write as things stand. */
export function findImportBlockers(
  files: SettlementPreviewFileDto[],
  accepted: SettlementConfirmation[]
): ImportBlocker[] {
  return files.flatMap(({ fileName, errors, records }) => {
    const missing =
      errors.length > 0
        ? 0
        : records
            .flatMap(({ key, confirmations }) =>
              confirmations.map((reason) => ({ key, reason }))
            )
            .filter(
              ({ key, reason }) =>
                !accepted.some((c) => c.key === key && c.reason === reason)
            ).length;

    return errors.length > 0 || missing > 0
      ? [{ fileName, errors: errors.length, missing }]
      : [];
  });
}
