import { RESULT_TEXT_CLASSES } from '@/components/settlements/result-tone';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  SettlementLineDto,
  UtilityDto,
} from '@/lib/settlements/dto/settlement-view-dto';
import {
  formatPrice,
  formatRange,
  formatVolume,
} from '@/lib/settlements/rules/view-format';
import {
  CONSUMPTION_SUFFIX,
  resultKind,
} from '@/lib/settlements/rules/view-wording';
import { cn, formatCurrency } from '@/lib/shared/utils';

interface Props {
  label: string;
  lines: SettlementLineDto[];
  unit?: string | null;
  /** The utility whose "Do rozliczenia" row closes the table */
  total?: UtilityDto;
}

export function SettlementLinesTable({ label, lines, unit, total }: Props) {
  return (
    <Table aria-label={label} className="min-w-[640px] tabular-nums">
      <TableHeader>
        <TableRow>
          <TableHead>Usługa</TableHead>
          {['Okres', 'Ilość', 'Cena', 'Kwota'].map((name) => (
            <TableHead key={name} className="text-right">
              {name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell>
              {line.description}
              {line.kind === 'CONSUMPTION' && CONSUMPTION_SUFFIX}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right">
              {formatRange(line.dateFrom, line.dateTo)}
            </TableCell>
            <TableCell className="text-right">
              {formatVolume(line.quantity, unit)}
            </TableCell>
            <TableCell className="text-right">
              {formatPrice(line.unitPrice)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(line.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {total && (
        <TableFooter className="font-semibold">
          <TableRow>
            <TableCell>Do rozliczenia</TableCell>
            <TableCell />
            <TableCell className="text-right">
              {formatVolume(total.difference, unit)}
            </TableCell>
            <TableCell />
            <TableCell
              className={cn(
                'text-right',
                RESULT_TEXT_CLASSES[resultKind(total.amount)]
              )}
            >
              {formatCurrency(total.amount)}
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
