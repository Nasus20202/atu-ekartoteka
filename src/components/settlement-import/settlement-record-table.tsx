import { STATUS_LABELS } from '@/components/settlement-import/labels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SettlementPreviewRecordDto } from '@/lib/settlements/dto/settlement-import-dto';
import { formatSpan } from '@/lib/settlements/rules/format';
import { formatCurrency } from '@/lib/shared/utils';

export function SettlementRecordTable({
  records,
}: {
  records: SettlementPreviewRecordDto[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lokal</TableHead>
          <TableHead>Właściciel</TableHead>
          <TableHead>Okres</TableHead>
          <TableHead className="text-right">Wynik</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.key}>
            <TableCell>{record.apartmentLabel}</TableCell>
            <TableCell>{record.printedOwner}</TableCell>
            <TableCell className="whitespace-nowrap">
              {formatSpan(record.periodFrom, record.periodTo)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right">
              {formatCurrency(record.totalAmount)}
            </TableCell>
            <TableCell>{STATUS_LABELS[record.status]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
