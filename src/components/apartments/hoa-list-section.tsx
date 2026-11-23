import { HoaListContent } from '@/components/apartments/hoa-list-content';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { SwrScope } from '@/components/providers/swr-scope';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';
import { toHoaListItemDto } from '@/lib/hoa/dto/hoa-dto';
import { findHoas } from '@/lib/hoa/queries/find-hoas';

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
