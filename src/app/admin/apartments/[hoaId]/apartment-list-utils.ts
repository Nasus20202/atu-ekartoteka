import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import { formatSharePercent } from '@/lib/utils';

type AddressFields = Pick<
  ApartmentSummaryDto,
  'address' | 'building' | 'number'
>;

export function buildAddressKey(apt: AddressFields): string {
  return `${apt.address ?? ''}__${apt.building ?? ''}__${apt.number}`;
}

export function formatApartmentShare({
  shareNumerator,
  shareDenominator,
}: ApartmentSummaryDto): string | null {
  return shareNumerator && shareDenominator && shareDenominator > 0
    ? `${formatSharePercent(shareNumerator, shareDenominator)}%`
    : null;
}

export function apartmentShareRatio({
  shareNumerator,
  shareDenominator,
}: ApartmentSummaryDto): number | null {
  return shareNumerator && shareDenominator && shareDenominator > 0
    ? shareNumerator / shareDenominator
    : null;
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
