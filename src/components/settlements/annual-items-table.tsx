import { ResultAmount } from '@/components/settlements/result-amount';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AnnualItemDto } from '@/lib/settlements/dto/settlement-view-dto';
import {
  formatBasis,
  formatCoefficient,
  formatRange,
} from '@/lib/settlements/rules/view-format';
import { formatCurrency } from '@/lib/shared/utils';

interface Props {
  items: AnnualItemDto[];
  totalAmount: string;
}

export function AnnualItemsTable({ items, totalAmount }: Props) {
  return (
    <Table
      aria-label="Pozycje rozliczenia"
      className="min-w-[760px] tabular-nums"
    >
      <TableHeader>
        <TableRow>
          <TableHead>Pozycja</TableHead>
          <TableHead className="text-right">
            Wspólnota: do rozliczenia
          </TableHead>
          <TableHead className="text-right">Współczynnik lokalu</TableHead>
          <TableHead className="text-right">Nadpłata / niedopłata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="font-semibold">{item.name}</div>
              <div className="text-muted-foreground">
                wg: {item.basisDescription}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.name !== item.title && `${item.title} · `}
                {formatRange(item.periodFrom, item.periodTo)}
              </div>
            </TableCell>
            <TableCell className="whitespace-nowrap text-right">
              {formatCurrency(item.communityAmount)}
            </TableCell>
            <TableCell className="text-right">
              <div>{formatCoefficient(item.coefficient)}</div>
              <div className="whitespace-nowrap text-muted-foreground">
                {formatBasis(item.flatBasis)} /{' '}
                {formatBasis(item.communityBasis)}
              </div>
            </TableCell>
            <TableCell>
              <ResultAmount
                amount={item.amount}
                className="text-right [&>div:first-child]:text-base"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-lg font-bold">
            Suma
          </TableCell>
          <TableCell>
            <ResultAmount amount={totalAmount} className="text-right" />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
