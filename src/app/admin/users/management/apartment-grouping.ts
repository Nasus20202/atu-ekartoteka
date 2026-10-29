import {
  addressKey,
  type UnassignedApartment,
} from '@/app/admin/users/management/apartment-row';

/** Owners with this many unassigned apartments are offered as one group. */
const EMAIL_GROUP_MIN_SIZE = 3;

export interface ApartmentGroups {
  duplicateAddressGroups: UnassignedApartment[][];
  occupiedTwins: UnassignedApartment[];
  emailGroups: UnassignedApartment[][];
  singles: UnassignedApartment[];
}

export function computeGroups(
  apartments: UnassignedApartment[]
): ApartmentGroups {
  const addrMap = new Map<string, UnassignedApartment[]>();
  for (const apt of apartments) {
    const key = addressKey(apt);
    if (!addrMap.has(key)) addrMap.set(key, []);
    addrMap.get(key)!.push(apt);
  }

  const duplicateIds = new Set<string>();
  const duplicateAddressGroups: UnassignedApartment[][] = [];
  for (const group of addrMap.values()) {
    if (group.length > 1) {
      duplicateAddressGroups.push(group);
      group.forEach((a) => duplicateIds.add(a.id));
    }
  }

  // Apartments not in a duplicate-address group but whose address is already
  // occupied by a tenant in another DB record
  const afterDuplicates = apartments.filter((a) => !duplicateIds.has(a.id));
  const occupiedTwinIds = new Set<string>();
  const occupiedTwins: UnassignedApartment[] = [];
  for (const apt of afterDuplicates) {
    if (apt.hasTwinWithTenant) {
      occupiedTwins.push(apt);
      occupiedTwinIds.add(apt.id);
    }
  }

  const remaining = afterDuplicates.filter((a) => !occupiedTwinIds.has(a.id));
  const emailMap = new Map<string, UnassignedApartment[]>();
  for (const apt of remaining) {
    if (!emailMap.has(apt.email)) emailMap.set(apt.email, []);
    emailMap.get(apt.email)!.push(apt);
  }

  const emailGroupIds = new Set<string>();
  const emailGroups: UnassignedApartment[][] = [];
  for (const group of emailMap.values()) {
    if (group.length >= EMAIL_GROUP_MIN_SIZE) {
      emailGroups.push(group);
      group.forEach((a) => emailGroupIds.add(a.id));
    }
  }

  const singles = remaining.filter((a) => !emailGroupIds.has(a.id));
  return { duplicateAddressGroups, occupiedTwins, emailGroups, singles };
}
