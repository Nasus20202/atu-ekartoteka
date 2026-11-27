import { ANNUAL_PATTERNS } from '@/lib/settlements/parsers/annual-patterns';
import {
  parseNumber,
  parsePrintedDate,
  signedResult,
} from '@/lib/settlements/parsers/parse-values';
import type { AnnualItem } from '@/lib/settlements/types/annual-settlement';

/** Collects the rows of one cost item, from its title to its result. */
export class AnnualItemBuilder {
  private readonly item: Partial<AnnualItem>;

  constructor(title: string, page: number) {
    this.item = { title, page };
  }

  /** Takes one row; false when it is not the next recognised part. */
  add(text: string): boolean {
    const match = (pattern: RegExp) => pattern.exec(text)?.slice(1);
    const { item } = this;
    let found: string[] | undefined;

    if ((found = match(ANNUAL_PATTERNS.communityAmount))) {
      return this.set('communityAmount', parseNumber(found[0]));
    }
    if ((found = match(ANNUAL_PATTERNS.period))) {
      const [from, to] = found.map(parsePrintedDate);
      if (!from || !to) return false;
      return this.set('periodFrom', from) && this.set('periodTo', to);
    }
    if ((found = match(ANNUAL_PATTERNS.basis))) {
      const key =
        item.coefficient === undefined ? 'flatBasis' : 'communityBasis';
      return this.set(key, parseNumber(found[0]));
    }
    if ((found = match(ANNUAL_PATTERNS.coefficient))) {
      return this.set('coefficient', parseNumber(found[0]));
    }
    if ((found = match(ANNUAL_PATTERNS.basisDescription))) {
      return this.set('basisDescription', found[0]);
    }
    return false;
  }

  /** The item closed by its result row, or null when parts are missing. */
  finish(label: string, value: string): AnnualItem | null {
    const item = { ...this.item, amount: signedResult(label, value) };
    const complete =
      item.communityAmount &&
      item.periodFrom &&
      item.periodTo &&
      item.flatBasis &&
      item.coefficient &&
      item.communityBasis &&
      item.basisDescription;
    return complete ? (item as AnnualItem) : null;
  }

  // Every part is printed once
  private set<K extends keyof AnnualItem>(
    key: K,
    value: AnnualItem[K]
  ): boolean {
    if (this.item[key] !== undefined) return false;
    this.item[key] = value;
    return true;
  }
}
