import { AssociationDataDates } from '@/components/import/association-data-dates';
import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
import { formatCount, formatMonthOrDash } from '@/lib/admin/rules/stats-format';

interface Props {
  associations: AssociationStatsDto[];
}

/** The associations as stacked cards, for screens too narrow for the table. */
export function AssociationStatsList({ associations }: Props) {
  return (
    <ul className="space-y-3">
      {associations.map((association) => (
        <li key={association.id} className="rounded-lg border p-3">
          <p className="font-medium break-words">{association.name}</p>
          <AssociationDataDates association={association} />
          <dl className="mt-3 space-y-1 text-sm">
            <Row
              label="Mieszkania"
              value={formatCount(association.apartments)}
            />
            <Row label="Naliczenia" value={formatCount(association.charges)} />
            <Row
              label="Powiadomienia"
              value={formatCount(association.notifications)}
            />
            <Row label="Wpłaty" value={formatCount(association.payments)} />
            <Row
              label="Rozliczenia mediów"
              value={formatCount(association.utilitySettlements)}
            />
            <Row
              label="Koszty rzeczywiste"
              value={formatCount(association.annualSettlements)}
            />
            <Row
              label="Ostatni okres naliczeń"
              value={formatMonthOrDash(association.lastChargePeriod)}
            />
          </dl>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}
