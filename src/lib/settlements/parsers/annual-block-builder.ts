import { AnnualItemBuilder } from '@/lib/settlements/parsers/annual-item-builder';
import { ANNUAL_PATTERNS } from '@/lib/settlements/parsers/annual-patterns';
import { signedResult } from '@/lib/settlements/parsers/parse-values';
import type {
  AnnualItem,
  ApartmentAddress,
  ParsedAnnualRecord,
} from '@/lib/settlements/types/annual-settlement';
import { sumDecimals } from '@/lib/shared/utils/sum';

export interface AnnualBlockHeader {
  address: ApartmentAddress;
  apartmentLabel: string;
  printedOwner: string;
  issuedOn: string;
}

/** Collects the items of one apartment, up to the apartment total. */
export class AnnualBlockBuilder {
  private readonly items: AnnualItem[] = [];
  private item: AnnualItemBuilder | null = null;

  constructor(private readonly header: AnnualBlockHeader) {}

  /** Takes one row; false when it is not a recognised part of the block. */
  add(text: string, page: number): boolean {
    const title = ANNUAL_PATTERNS.title.exec(text)?.[1];
    if (title) {
      if (this.item) return false;
      this.item = new AnnualItemBuilder(title, page);
      return true;
    }
    if (ANNUAL_PATTERNS.heading.test(text)) return !this.item;

    const result = ANNUAL_PATTERNS.itemResult.exec(text);
    if (result) {
      const item = this.item?.finish(result[1], result[2]);
      if (item) this.items.push(item);
      this.item = null;
      return Boolean(item);
    }
    return this.item?.add(text) ?? false;
  }

  /** The block closed by its total row, or null when parts are missing. */
  finish(
    label: string,
    value: string,
    page: number
  ): ParsedAnnualRecord | null {
    if (this.item || this.items.length === 0) return null;
    const total = signedResult(label, value);
    const froms = this.items.map((i) => i.periodFrom).sort();
    const tos = this.items.map((i) => i.periodTo).sort();
    return {
      ...this.header,
      periodFrom: froms[0],
      periodTo: tos[tos.length - 1],
      totalAmount: total,
      items: this.items,
      apartmentTotals: [
        {
          page,
          total,
          itemSum: sumDecimals(this.items.map((i) => i.amount)),
        },
      ],
    };
  }
}
