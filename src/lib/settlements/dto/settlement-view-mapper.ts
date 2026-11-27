import type {
  AnnualCostSettlement,
  AnnualCostSettlementItem,
  MeterReading,
  UtilitySettlement,
  UtilitySettlementLine,
} from '@/generated/prisma/browser';
import type {
  AnnualSettlementDto,
  MeterReadingDto,
  SettlementLineDto,
  SettlementPeriodDto,
  UtilityDto,
  UtilitySettlementDto,
} from '@/lib/settlements/dto/settlement-view-dto';
import {
  annualItemName,
  utilityName,
} from '@/lib/settlements/rules/display-names';
import {
  groupByCode,
  utilityUnit,
} from '@/lib/settlements/rules/group-by-code';
import { dateToIso } from '@/lib/settlements/rules/periods';
import type { Decimal } from '@/lib/shared/utils/decimal';

/** The sums of one summary code, added up by the database. */
export interface CodeSums {
  code: string;
  consumption: Decimal;
  advanceQuantity: Decimal;
  difference: Decimal;
  amount: Decimal;
}

export interface KindSums {
  advanceAmount: Decimal;
  consumptionAmount: Decimal;
}

export const toPeriodDto = (row: {
  id: string;
  periodFrom: Date;
  periodTo: Date;
}): SettlementPeriodDto => ({
  id: row.id,
  periodFrom: dateToIso(row.periodFrom),
  periodTo: dateToIso(row.periodTo),
});

const toDocumentDto = (row: UtilitySettlement | AnnualCostSettlement) => ({
  ...toPeriodDto(row),
  origin: {
    issuedOn: dateToIso(row.issuedOn),
    sourceFileName: row.sourceFileName,
  },
  printedOwner: row.printedOwner,
  totalAmount: row.totalAmount.toString(),
});

const toLineDto = (line: UtilitySettlementLine): SettlementLineDto => ({
  id: line.id,
  kind: line.kind,
  description: line.description,
  dateFrom: dateToIso(line.dateFrom),
  dateTo: dateToIso(line.dateTo),
  quantity: line.quantity.toString(),
  unitPrice: line.unitPrice.toString(),
  amount: line.amount.toString(),
});

export function toReadingDto(
  reading: MeterReading,
  codes: string[]
): MeterReadingDto {
  const code = groupByCode(reading.device, codes);
  return {
    id: reading.id,
    device: reading.device,
    serialNumber: reading.serialNumber,
    label: reading.label,
    unit: reading.unit,
    startDate: dateToIso(reading.startDate),
    startValue: reading.startValue.toString(),
    endDate: dateToIso(reading.endDate),
    endValue: reading.endValue.toString(),
    consumption: reading.consumption.toString(),
    utilityName: code && utilityName(code),
  };
}

export function toUtilityDto(
  row: UtilitySettlement & {
    lines: UtilitySettlementLine[];
    readings: MeterReading[];
  },
  codeSums: CodeSums[],
  kindSums: KindSums
): UtilitySettlementDto {
  const codes = codeSums.map((sums) => sums.code);
  const codeOf = (name: string) => groupByCode(name, codes);
  const utilities: UtilityDto[] = codeSums.map((sums) => {
    const lines = row.lines.filter((l) => codeOf(l.description) === sums.code);
    return {
      code: sums.code,
      name: utilityName(sums.code),
      unit: utilityUnit(
        sums.code,
        codes,
        row.readings,
        lines.map((l) => l.description)
      ),
      consumption: sums.consumption.toString(),
      advanceQuantity: sums.advanceQuantity.toString(),
      difference: sums.difference.toString(),
      amount: sums.amount.toString(),
      lines: lines.map(toLineDto),
      meters: row.readings
        .filter((r) => codeOf(r.device) === sums.code)
        .map((r) => toReadingDto(r, codes)),
    };
  });

  return {
    ...toDocumentDto(row),
    advanceAmount: kindSums.advanceAmount.toString(),
    consumptionAmount: kindSums.consumptionAmount.toString(),
    utilities,
    otherLines: row.lines
      .filter((l) => codeOf(l.description) === null)
      .map(toLineDto),
    otherMeters: row.readings
      .filter((r) => codeOf(r.device) === null)
      .map((r) => toReadingDto(r, codes)),
  };
}

export function toAnnualDto(
  row: AnnualCostSettlement & { items: AnnualCostSettlementItem[] }
): AnnualSettlementDto {
  return {
    ...toDocumentDto(row),
    items: row.items.map((item) => ({
      id: item.id,
      name: annualItemName(item.basisDescription, item.title),
      title: item.title,
      basisDescription: item.basisDescription,
      periodFrom: dateToIso(item.periodFrom),
      periodTo: dateToIso(item.periodTo),
      communityAmount: item.communityAmount.toString(),
      flatBasis: item.flatBasis.toString(),
      communityBasis: item.communityBasis.toString(),
      coefficient: item.coefficient.toString(),
      amount: item.amount.toString(),
    })),
  };
}
