import { UtilitySettlementLineKind } from '@/generated/prisma/browser';
import {
  parseNumber,
  parsePrintedDate,
  signedResult,
} from '@/lib/settlements/parsers/parse-values';
import { UTILITY_PATTERNS } from '@/lib/settlements/parsers/utility-patterns';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';
import { sumDecimals } from '@/lib/shared/utils/sum';

const COLUMN_KINDS: Record<string, UtilitySettlementLineKind> = {
  Zaliczka: UtilitySettlementLineKind.ADVANCE,
  'Do zapłaty': UtilitySettlementLineKind.CONSUMPTION,
};

type Content = Pick<ParsedUtilityRecord, 'lines' | 'summaries' | 'readings'>;

/** Collects the rows of one record on one page, from the owner to the total. */
export class UtilityRecordBuilder {
  private apartmentExternalId: string | null = null;
  private period: { from: string; to: string } | null = null;
  private service: {
    description: string;
    kind?: UtilitySettlementLineKind;
  } | null = null;
  private readonly content: Content = {
    lines: [],
    summaries: [],
    readings: [],
  };

  constructor(
    private readonly printedOwner: string,
    private readonly issuedOn: string
  ) {}

  /** Takes one row; false when it is not a recognised part of a record. */
  add(text: string): boolean {
    const match = (pattern: RegExp) => pattern.exec(text)?.slice(1);
    let found: string[] | undefined;

    if ((found = match(UTILITY_PATTERNS.apartment))) {
      if (this.apartmentExternalId) return false;
      this.apartmentExternalId = found[0];
    } else if ((found = match(UTILITY_PATTERNS.service))) {
      this.service = { description: found[0] };
    } else if ((found = match(UTILITY_PATTERNS.columns))) {
      const kind = COLUMN_KINDS[found[0]];
      if (!this.service || !kind) return false;
      this.service.kind = kind;
    } else if ((found = match(UTILITY_PATTERNS.line))) {
      return this.addLine(found);
    } else if (UTILITY_PATTERNS.meterHeader.test(text)) {
      this.service = null;
    } else if ((found = match(UTILITY_PATTERNS.meter))) {
      return this.addReading(found);
    } else if ((found = match(UTILITY_PATTERNS.period))) {
      const [from, to] = found.map(parsePrintedDate);
      if (!from || !to || this.period) return false;
      this.period = { from, to };
      this.service = null;
    } else if ((found = match(UTILITY_PATTERNS.summary))) {
      const [consumption, advanceQuantity, difference, amount] = found
        .slice(1)
        .map(parseNumber);
      this.content.summaries.push({
        code: found[0].trim(),
        consumption,
        advanceQuantity,
        difference,
        amount,
      });
    } else {
      return false;
    }
    return true;
  }

  /** The record closed by its total row, or null when parts are missing. */
  finish(
    label: string,
    value: string,
    page: number
  ): ParsedUtilityRecord | null {
    const { apartmentExternalId, period, content } = this;
    if (!apartmentExternalId || !period || content.summaries.length === 0) {
      return null;
    }
    const total = signedResult(label, value);
    return {
      ...content,
      apartmentExternalId,
      printedOwner: this.printedOwner,
      periodFrom: period.from,
      periodTo: period.to,
      issuedOn: this.issuedOn,
      totalAmount: total,
      pageTotals: [
        {
          page,
          total,
          summarySum: sumDecimals(content.summaries.map((s) => s.amount)),
        },
      ],
    };
  }

  private addLine(found: string[]): boolean {
    const dateFrom = parsePrintedDate(found[0]);
    const dateTo = parsePrintedDate(found[1]);
    const { description, kind } = this.service ?? {};
    if (!description || !kind || !dateFrom || !dateTo) return false;
    const [quantity, unitPrice, amount] = found.slice(2).map(parseNumber);
    this.content.lines.push({
      kind,
      description,
      dateFrom,
      dateTo,
      quantity,
      unitPrice,
      amount,
    });
    return true;
  }

  private addReading(found: string[]): boolean {
    const [device, serialNumber, label, from, start, to, end, used, unit] =
      found;
    const startDate = parsePrintedDate(from);
    const endDate = parsePrintedDate(to);
    if (!startDate || !endDate) return false;
    this.service = null;
    this.content.readings.push({
      device,
      serialNumber,
      label: label.trim(),
      unit,
      startDate,
      startValue: parseNumber(start),
      endDate,
      endValue: parseNumber(end),
      consumption: parseNumber(used),
    });
    return true;
  }
}
