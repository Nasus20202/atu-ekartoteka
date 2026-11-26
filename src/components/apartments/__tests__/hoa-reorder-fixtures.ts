import type { HoaListItemDto } from '@/lib/hoa/dto/hoa-dto';

export function makeHoa(
  id: string,
  name: string,
  overrides: Partial<HoaListItemDto> = {}
): HoaListItemDto {
  return {
    id,
    externalId: `EXT-${id}`,
    name,
    apartmentCount: 3,
    apartmentsDataDate: null,
    chargesDataDate: null,
    notificationsDataDate: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export const THREE_HOAS = [
  makeHoa('a', 'Alfa', { apartmentCount: 1 }),
  makeHoa('b', 'Beta', { apartmentCount: 4 }),
  makeHoa('c', 'Gamma', {
    apartmentCount: 12,
    apartmentsDataDate: '2026-11-21T00:00:00.000Z',
  }),
];
