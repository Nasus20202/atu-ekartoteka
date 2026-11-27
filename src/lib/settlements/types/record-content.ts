import type {
  AnnualItem,
  ParsedAnnualRecord,
} from '@/lib/settlements/types/annual-settlement';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';

type Identity = 'printedOwner' | 'periodFrom' | 'periodTo' | 'totalAmount';

/** What makes two utility settlements of a period the same. */
export type UtilityContent = Pick<
  ParsedUtilityRecord,
  Identity | 'lines' | 'summaries' | 'readings'
>;

/** What makes two annual settlements of a period the same. */
export type AnnualContent = Pick<ParsedAnnualRecord, Identity> & {
  items: Array<Omit<AnnualItem, 'page'>>;
};
