import { loadApartmentsPage } from '@/app/api/admin/apartments/load-apartments-page';
import { HoaApartmentsContent } from '@/components/apartments/hoa-apartments-content';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { SwrScope } from '@/components/providers/swr-scope';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { LIST_VIEW_STORAGE_KEYS } from '@/lib/list-view-mode';
import { getListViewMode } from '@/lib/list-view-mode-server';

const PAGE_SIZE = 20;

interface HoaApartmentsSectionProps {
  params: Promise<{ hoaId: string }>;
  searchParams: Promise<{ search?: string; activeOnly?: string }>;
}

/** First page of the list, for the URL query the page was opened with. */
export async function HoaApartmentsSection({
  params,
  searchParams,
}: HoaApartmentsSectionProps) {
  await requireAdminAccess();
  const [{ hoaId }, query] = await Promise.all([params, searchParams]);

  const [{ apartments, hoa, pagination }, viewMode] = await Promise.all([
    loadApartmentsPage({
      page: 1,
      limit: PAGE_SIZE,
      hoaId,
      search: query.search?.trim() ?? '',
      activeOnly: query.activeOnly === 'true',
      assignableTo: null,
      order: 'asc',
    }),
    getListViewMode(LIST_VIEW_STORAGE_KEYS.apartments),
  ]);

  return (
    <div className={REVEAL_CLASS}>
      <SwrScope>
        <HoaApartmentsContent
          hoaId={hoaId}
          initial={{ hoa, page: { items: apartments, ...pagination } }}
          initialViewMode={viewMode}
        />
      </SwrScope>
    </div>
  );
}
