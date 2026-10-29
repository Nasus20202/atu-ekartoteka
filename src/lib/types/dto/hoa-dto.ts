import { toIsoString } from '@/lib/types/dto/iso-string';

export interface HoaListItemDtoSource {
  id: string;
  externalId: string;
  name: string;
  _count: { apartments: number };
  apartmentsDataDate: Date | string | null;
  chargesDataDate: Date | string | null;
  notificationsDataDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface HoaListItemDto {
  id: string;
  externalId: string;
  name: string;
  apartmentCount: number;
  apartmentsDataDate: string | null;
  chargesDataDate: string | null;
  notificationsDataDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function toOptionalIsoString(value: Date | string | null): string | null {
  return value === null ? null : toIsoString(value);
}

export function toHoaListItemDto(hoa: HoaListItemDtoSource): HoaListItemDto {
  return {
    id: hoa.id,
    externalId: hoa.externalId,
    name: hoa.name,
    apartmentCount: hoa._count.apartments,
    apartmentsDataDate: toOptionalIsoString(hoa.apartmentsDataDate),
    chargesDataDate: toOptionalIsoString(hoa.chargesDataDate),
    notificationsDataDate: toOptionalIsoString(hoa.notificationsDataDate),
    createdAt: toIsoString(hoa.createdAt),
    updatedAt: toIsoString(hoa.updatedAt),
  };
}
