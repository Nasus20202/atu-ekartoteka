import type { Prisma } from '@/generated/prisma/client';

const BUILDING_NUMBER_SEPARATOR = '/';

interface ApartmentsFilter {
  search: string;
  activeOnly: boolean;
  hoaId: string | null;
  assignableTo: string | null;
}

function contains(value: string) {
  return { contains: value, mode: 'insensitive' as const };
}

// "ul. Lipowa 10" is the address followed by the building of a label
function addressWithBuilding(text: string): Prisma.ApartmentWhereInput[] {
  const lastSpace = text.lastIndexOf(' ');
  if (lastSpace < 0) return [];
  return [
    {
      address: contains(text.slice(0, lastSpace).trim()),
      building: contains(text.slice(lastSpace + 1)),
    },
  ];
}

// "17/12" means building 17, number 12; "ul. Lipowa 17/12" adds the address
function buildSearchCondition(search: string): Prisma.ApartmentWhereInput {
  if (!search) return {};

  if (search.includes(BUILDING_NUMBER_SEPARATOR)) {
    const [buildingPart, numberPart] = search
      .split(BUILDING_NUMBER_SEPARATOR)
      .map((part) => part.trim());
    return {
      AND: [
        buildingPart
          ? {
              OR: [
                { building: contains(buildingPart) },
                ...addressWithBuilding(buildingPart),
              ],
            }
          : {},
        numberPart ? { number: contains(numberPart) } : {},
      ],
    };
  }

  return {
    OR: [
      { number: contains(search) },
      { owner: contains(search) },
      { email: contains(search) },
      { address: contains(search) },
      { building: contains(search) },
      { city: contains(search) },
      { externalOwnerId: contains(search) },
      { externalApartmentId: contains(search) },
      ...addressWithBuilding(search),
    ],
  };
}

export function buildApartmentsWhere({
  search,
  activeOnly,
  hoaId,
  assignableTo,
}: ApartmentsFilter): Prisma.ApartmentWhereInput {
  return {
    AND: [
      hoaId ? { homeownersAssociationId: hoaId } : {},
      activeOnly ? { isActive: true } : {},
      // Free apartments plus those already held by the user being edited
      assignableTo ? { OR: [{ userId: null }, { userId: assignableTo }] } : {},
      buildSearchCondition(search),
    ],
  };
}
