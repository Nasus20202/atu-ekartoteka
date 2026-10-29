import {
  type HoaGroup,
  type UnassignedApartment,
} from '@/app/admin/users/management/hoa-card';

export interface AccountPreview {
  email: string;
  owner: string | null;
  apartments: UnassignedApartment[];
}

export function buildAccountPreviews(
  hoas: HoaGroup[],
  selectedIds: Set<string>
): AccountPreview[] {
  const allApartments = hoas.flatMap((h) => h.apartments);
  const selected = allApartments.filter((a) => selectedIds.has(a.id));
  const emailMap = new Map<string, AccountPreview>();
  for (const apt of selected) {
    const preview = emailMap.get(apt.email) ?? {
      email: apt.email,
      owner: apt.owner,
      apartments: [],
    };
    preview.apartments.push(apt);
    emailMap.set(apt.email, preview);
  }
  return Array.from(emailMap.values());
}
