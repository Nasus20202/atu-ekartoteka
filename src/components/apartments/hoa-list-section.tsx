import { HoaListContent } from '@/components/apartments/hoa-list-content';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { SwrScope } from '@/components/providers/swr-scope';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { findHoas } from '@/lib/queries/hoa/find-hoas';
import { toHoaListItemDto } from '@/lib/types/dto/hoa-dto';

export async function HoaListSection() {
  await requireAdminAccess();
  const hoas = await findHoas('');

  return (
    <div className={REVEAL_CLASS}>
      <SwrScope>
        <HoaListContent initialHoas={hoas.map(toHoaListItemDto)} />
      </SwrScope>
    </div>
  );
}
