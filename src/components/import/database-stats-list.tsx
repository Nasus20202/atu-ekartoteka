import type { DatabaseStatsDto } from '@/lib/admin/dto/database-stats-dto';
import { buildSummaryRows } from '@/lib/admin/rules/database-stats-rows';

interface Props {
  stats: DatabaseStatsDto;
}

/** The summary rows as stacked cards, for screens too narrow for the table. */
export function DatabaseStatsList({ stats }: Props) {
  return (
    <ul className="space-y-3">
      {buildSummaryRows(stats).map((row) => (
        <li key={row.label} className="rounded-lg border p-3">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-medium">{row.label}</p>
            <p className="text-right tabular-nums">{row.count}</p>
          </div>
          {row.detail && (
            <p className="text-xs text-muted-foreground">{row.detail}</p>
          )}
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Zakres</dt>
              <dd className="text-right">{row.range}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Ostatnia zmiana</dt>
              <dd className="text-right">{row.changedAt}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
