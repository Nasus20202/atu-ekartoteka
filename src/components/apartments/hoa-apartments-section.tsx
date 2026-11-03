import { loadApartmentsPage } from '@/app/api/admin/apartments/load-apartments-page';
import { HoaApartmentsContent } from '@/components/apartments/hoa-apartments-content';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';

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

  const { apartments, hoa, pagination } = await loadApartmentsPage({
    page: 1,
    limit: PAGE_SIZE,
    hoaId,
    search: query.search?.trim() ?? '',
    activeOnly: query.activeOnly === 'true',
    assignableTo: null,
    order: 'asc',
  });

  return (
    <HoaApartmentsContent
      hoaId={hoaId}
      initial={{ hoa, page: { items: apartments, ...pagination } }}
    />
  );
}
