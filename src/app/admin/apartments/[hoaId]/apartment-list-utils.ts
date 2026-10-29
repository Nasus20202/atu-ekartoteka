import { type ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';

const PAGE_WINDOW = 2;
const FEW_UPPER_BOUND = 5;

export type PageItem = number | 'ellipsis';

type AddressFields = Pick<
  ApartmentSummaryDto,
  'address' | 'building' | 'number'
>;

export function buildAddressKey(apt: AddressFields): string {
  return `${apt.address ?? ''}__${apt.building ?? ''}__${apt.number}`;
}

export function computeDuplicateActiveAddresses(
  apartments: (AddressFields & Pick<ApartmentSummaryDto, 'isActive'>)[]
): Set<string> {
  const counts = new Map<string, number>();
  for (const apt of apartments) {
    if (!apt.isActive) continue;
    const key = buildAddressKey(apt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  for (const [key, count] of counts) {
    if (count > 1) duplicates.add(key);
  }
  return duplicates;
}

export function getPageItems(page: number, totalPages: number): PageItem[] {
  const items: PageItem[] = [];
  for (let p = 1; p <= totalPages; p++) {
    const isNearCurrent =
      Math.abs(p - page) <= PAGE_WINDOW || p === 1 || p === totalPages;
    if (isNearCurrent) {
      items.push(p);
    } else if (p === page - PAGE_WINDOW - 1 || p === page + PAGE_WINDOW + 1) {
      items.push('ellipsis');
    }
  }
  return items;
}

export function getFoundApartmentsLabel(total: number): string {
  if (total === 1) return 'mieszkanie';
  return total < FEW_UPPER_BOUND && total > 1 ? 'mieszkania' : 'mieszkań';
}
