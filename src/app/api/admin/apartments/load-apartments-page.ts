import { buildApartmentsWhere } from '@/app/api/admin/apartments/apartments-where';
import { findApartmentsPaginated } from '@/lib/queries/apartments/find-apartments-paginated';
import {
  toApartmentSummaryDto,
  toHomeownersAssociationNoticeDto,
} from '@/lib/types/dto/apartment-dto';
import type { ApartmentSortKey, SortDirection } from '@/lib/utils/sort';

export interface ApartmentsPageParams {
  page: number;
  limit: number;
  hoaId: string | null;
  search: string;
  activeOnly: boolean;
  assignableTo: string | null;
  sort?: ApartmentSortKey;
  order: SortDirection;
}

/** One page of admin apartments as DTOs, shared by the API route and server pages. */
export async function loadApartmentsPage(params: ApartmentsPageParams) {
  const { page, limit, hoaId, sort, order } = params;
  const where = buildApartmentsWhere({
    search: params.search,
    activeOnly: params.activeOnly,
    hoaId,
    assignableTo: params.assignableTo,
  });

  const [apartments, total, hoa] = await findApartmentsPaginated({
    where,
    skip: (page - 1) * limit,
    limit,
    hoaId,
    sort,
    order,
  });

  return {
    apartments: apartments.map(toApartmentSummaryDto),
    hoa: hoa ? toHomeownersAssociationNoticeDto(hoa) : null,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
