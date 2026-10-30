import { type ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';

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
