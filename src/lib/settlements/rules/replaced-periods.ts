import type { PreparedFile } from '@/lib/settlements/types/prepared-file';
import type { ReplacedPeriods } from '@/lib/settlements/types/stored-data';

/**
 * The periods the files cover, for each kind of settlement and homeowners
 * association. Records without an apartment name no association.
 */
export function replacedPeriods(files: PreparedFile[]): ReplacedPeriods[] {
  const scopes = new Map<string, ReplacedPeriods>();

  for (const { type, apartment, record } of files.flatMap((f) => f.records)) {
    if (!apartment) continue;

    const { homeownersAssociationId } = apartment;
    const key = JSON.stringify([type, homeownersAssociationId]);
    const scope = scopes.get(key) ?? {
      type,
      homeownersAssociationId,
      periods: [],
    };
    const { periodFrom, periodTo } = record;
    const listed = scope.periods.some(
      (p) => p.periodFrom === periodFrom && p.periodTo === periodTo
    );
    if (!listed) scope.periods.push({ periodFrom, periodTo });
    scopes.set(key, scope);
  }

  return [...scopes.values()];
}
