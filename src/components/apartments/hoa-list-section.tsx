import { HoaListContent } from '@/components/apartments/hoa-list-content';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { findHoas } from '@/lib/queries/hoa/find-hoas';
import { toHoaListItemDto } from '@/lib/types/dto/hoa-dto';

export async function HoaListSection() {
  await requireAdminAccess();
  const hoas = await findHoas('');

  return <HoaListContent initialHoas={hoas.map(toHoaListItemDto)} />;
}
