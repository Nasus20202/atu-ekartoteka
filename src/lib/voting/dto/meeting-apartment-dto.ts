import { formatOwnedApartmentLabel } from '@/lib/shared/utils/apartment-label';

export interface MeetingApartmentSource {
  id: string;
  owner: string | null;
  address: string | null;
  building: string | null;
  number: string;
}

export interface MeetingApartmentDto {
  id: string;
  label: string;
}

export function toMeetingApartmentDto(
  apartment: MeetingApartmentSource
): MeetingApartmentDto {
  return { id: apartment.id, label: formatOwnedApartmentLabel(apartment) };
}
