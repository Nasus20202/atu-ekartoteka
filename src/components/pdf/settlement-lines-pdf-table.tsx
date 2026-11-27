import { PdfTable } from '@/components/pdf/pdf-table';
import { RESULT_COLORS } from '@/components/pdf/settlement-pdf-parts';
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
import { formatCurrency } from '@/lib/shared/utils';

const COLUMNS = [
  { header: 'Usługa' },
  { header: 'Okres', width: 105 },
  { header: 'Ilość', width: 75 },
  { header: 'Cena', width: 60 },
  { header: 'Kwota', width: 70 },
];

interface Props {
  lines: SettlementLineDto[];
  /** The utility whose "Do rozliczenia" row closes the table */
  total?: UtilityDto;
}

export function SettlementLinesPdfTable({ lines, total }: Props) {
  const unit = total?.unit;
  const rows = lines.map((line) => ({
    key: line.id,
    cells: [
      line.kind === 'CONSUMPTION'
        ? `${line.description}${CONSUMPTION_SUFFIX}`
        : line.description,
      formatRange(line.dateFrom, line.dateTo),
      formatVolume(line.quantity, unit),
      formatPrice(line.unitPrice),
      formatCurrency(line.amount),
    ],
  }));
  const totalRow = total && {
    key: 'total',
    total: true,
    cells: [
      'Do rozliczenia',
      '',
      formatVolume(total.difference, unit),
      '',
      {
        lines: [formatCurrency(total.amount)],
        style: RESULT_COLORS[resultKind(total.amount)],
      },
    ],
  };

  return (
    <PdfTable columns={COLUMNS} rows={totalRow ? [...rows, totalRow] : rows} />
  );
}
