import { Document } from '@react-pdf/renderer';

import { PdfTable } from '@/components/pdf/pdf-table';
import { DocumentPage, PdfNoteText } from '@/components/pdf/primitives';
import {
  RESULT_COLORS,
  SettlementPdfDetails,
  SettlementPdfHeader,
  SettlementPdfResult,
  type SettlementPdfSubject,
} from '@/components/pdf/settlement-pdf-parts';
import { registerPdfFonts } from '@/lib/platform/pdf/register-fonts';
import type { AnnualSettlementDto } from '@/lib/settlements/dto/settlement-view-dto';
import {
  formatAbsoluteAmount,
  formatAnnualPeriod,
  formatBasis,
  formatCoefficient,
  formatRange,
} from '@/lib/settlements/rules/view-format';
import {
  annualResultTitle,
  COMMUNITY_AMOUNT_NOTE,
  RESULT_LABELS,
  resultKind,
} from '@/lib/settlements/rules/view-wording';
import { formatCurrency } from '@/lib/shared/utils';
import { formatCountPl, ITEM_FORMS } from '@/lib/shared/utils/pluralize';

registerPdfFonts();

const COLUMNS = [
  { header: 'Pozycja' },
  { header: 'Wspólnota: do rozliczenia', width: 125 },
  { header: 'Współczynnik lokalu', width: 95 },
  { header: 'Nadpłata / niedopłata', width: 105 },
];

const resultCell = (amount: string) => {
  const kind = resultKind(amount);
  return {
    lines: [formatAbsoluteAmount(amount), RESULT_LABELS[kind]],
    style: RESULT_COLORS[kind],
  };
};

interface Props extends SettlementPdfSubject {
  settlement: AnnualSettlementDto;
}

export function AnnualCostsPdfDocument({ settlement, ...subject }: Props) {
  const { items, totalAmount, periodFrom, periodTo } = settlement;
  const rows = items.map((item) => ({
    key: item.id,
    cells: [
      {
        lines: [
          item.name,
          `wg: ${item.basisDescription}`,
          item.title,
          formatRange(item.periodFrom, item.periodTo),
        ],
      },
      formatCurrency(item.communityAmount),
      {
        lines: [
          formatCoefficient(item.coefficient),
          `${formatBasis(item.flatBasis)} / ${formatBasis(item.communityBasis)}`,
        ],
      },
      resultCell(item.amount),
    ],
  }));

  return (
    <Document>
      <DocumentPage>
        <SettlementPdfHeader
          {...subject}
          title="Koszty rzeczywiste"
          printedOwner={settlement.printedOwner}
          period={formatAnnualPeriod(periodFrom, periodTo)}
        />
        <SettlementPdfResult
          title={annualResultTitle(totalAmount, periodTo)}
          amount={totalAmount}
          detail={`${formatCountPl(items.length, ITEM_FORMS)} · ${formatRange(periodFrom, periodTo)}`}
        />
        <PdfTable
          columns={COLUMNS}
          rows={[
            ...rows,
            {
              key: 'total',
              total: true,
              cells: ['Suma', '', '', resultCell(totalAmount)],
            },
          ]}
        />
        <PdfNoteText>{COMMUNITY_AMOUNT_NOTE}</PdfNoteText>
        <SettlementPdfDetails origin={settlement.origin} />
      </DocumentPage>
    </Document>
  );
}
