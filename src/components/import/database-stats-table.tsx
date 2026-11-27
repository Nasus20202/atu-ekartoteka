import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DatabaseStatsDto } from '@/lib/admin/dto/database-stats-dto';
import { buildSummaryRows } from '@/lib/admin/rules/database-stats-rows';

const COLUMNS = ['Dane', 'Liczba', 'Zakres', 'Ostatnia zmiana'];

interface Props {
  stats: DatabaseStatsDto;
}

export function DatabaseStatsTable({ stats }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((label) => (
            <TableHead key={label}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {buildSummaryRows(stats).map((row) => (
          <TableRow key={row.label}>
            <TableCell className="font-medium">{row.label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.count}
              {row.detail && (
                <span className="block text-xs font-normal text-muted-foreground">
                  {row.detail}
                </span>
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap">{row.range}</TableCell>
            <TableCell className="whitespace-nowrap">{row.changedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
