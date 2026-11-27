import { AssociationDataDates } from '@/components/import/association-data-dates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
import { formatCount, formatMonthOrDash } from '@/lib/admin/rules/stats-format';

// Visible labels are short; the title keeps the full name for mouse users
const COLUMNS: Array<{ label: string; title?: string }> = [
  { label: 'Wspólnota' },
  { label: 'Mieszkania' },
  { label: 'Naliczenia' },
  { label: 'Powiadomienia' },
  { label: 'Wpłaty' },
  { label: 'Rozl. mediów', title: 'Rozliczenia mediów' },
  { label: 'Koszty rzecz.', title: 'Koszty rzeczywiste' },
  { label: 'Ostatni okres', title: 'Ostatni okres naliczeń' },
];

interface Props {
  associations: AssociationStatsDto[];
}

export function AssociationStatsTable({ associations }: Props) {
  return (
    <Table className="text-sm">
      <TableHeader>
        <TableRow>
          {COLUMNS.map(({ label, title }) => (
            <TableHead
              key={label}
              title={title}
              className="px-2 text-xs whitespace-normal"
            >
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {associations.map((association) => (
          <TableRow key={association.id}>
            <TableCell className="min-w-44 px-2 py-2 font-medium break-words whitespace-normal">
              {association.name}
              <AssociationDataDates association={association} />
            </TableCell>
            <TableCell className="px-2 text-right tabular-nums">
              {formatCount(association.apartments)}
            </TableCell>
            <TableCell className="px-2 text-right tabular-nums">
              {formatCount(association.charges)}
            </TableCell>
            <TableCell className="px-2 text-right tabular-nums">
              {formatCount(association.notifications)}
            </TableCell>
            <TableCell className="px-2 text-right tabular-nums">
              {formatCount(association.payments)}
            </TableCell>
            <TableCell className="px-2 text-right tabular-nums">
              {formatCount(association.utilitySettlements)}
            </TableCell>
            <TableCell className="px-2 text-right tabular-nums">
              {formatCount(association.annualSettlements)}
            </TableCell>
            <TableCell className="px-2 whitespace-nowrap">
              {formatMonthOrDash(association.lastChargePeriod)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
