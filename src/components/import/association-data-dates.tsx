import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
import { buildDataDateLines } from '@/lib/admin/rules/database-stats-rows';

interface Props {
  association: AssociationStatsDto;
}

/** The data-as-of dates of an association, as a muted block under its name. */
export function AssociationDataDates({ association }: Props) {
  return (
    <ul className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
      {buildDataDateLines(association).map((line) => (
        <li key={line.label} className="whitespace-nowrap">
          {line.label}: {line.value}
        </li>
      ))}
    </ul>
  );
}
