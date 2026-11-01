'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { ApartmentCard } from '@/app/admin/apartments/[hoaId]/apartment-card';
import {
  buildAddressKey,
  computeDuplicateActiveAddresses,
} from '@/app/admin/apartments/[hoaId]/apartment-list-utils';
import { ApartmentSearchForm } from '@/app/admin/apartments/[hoaId]/apartment-search-form';
import { ApartmentTable } from '@/app/admin/apartments/[hoaId]/apartment-table';
import { HoaNoticeCard } from '@/app/admin/apartments/[hoaId]/hoa-notice-card';
import { useHoaApartments } from '@/app/admin/apartments/[hoaId]/use-hoa-apartments';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { InfiniteScrollSentinel } from '@/components/ui/infinite-scroll-sentinel';
import { ListViewSwitch } from '@/components/ui/list-view-switch';
import { LoadingCard } from '@/components/ui/loading-card';
import { ViewTransition } from '@/components/ui/view-transition';
import {
  LIST_VIEW_STORAGE_KEYS,
  ListViewMode,
  useListViewMode,
} from '@/lib/hooks/use-list-view-mode';
import { APARTMENT_FORMS, pluralizePl } from '@/lib/utils/pluralize';

export default function HOAApartmentsPage() {
  const params = useParams();
  const hoaId = params.hoaId as string;
  const {
    apartments,
    hoa,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    search,
    activeOnly,
    updateURL,
    sort,
    setSort,
  } = useHoaApartments(hoaId);
  const [viewMode, setViewMode] = useListViewMode(
    LIST_VIEW_STORAGE_KEYS.apartments
  );

  const duplicateActiveAddresses = useMemo(
    () => computeDuplicateActiveAddresses(apartments),
    [apartments]
  );

  const handleActiveOnlyChange = (checked: boolean) => {
    updateURL({ activeOnly: checked.toString() });
  };

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title={hoa ? hoa.name : 'Wspólnota'}
        description={hoa ? hoa.externalId : undefined}
        showBackButton={true}
        action={
          <div className="flex shrink-0 flex-wrap items-center gap-4">
            <ListViewSwitch value={viewMode} onChange={setViewMode} />
            <label
              htmlFor="active-only"
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                id="active-only"
                checked={activeOnly}
                onCheckedChange={(checked) =>
                  handleActiveOnlyChange(checked === true)
                }
              />
              Tylko aktywne
            </label>
          </div>
        }
      />

      {hoa && <HoaNoticeCard header={hoa.header} footer={hoa.footer} />}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Wyszukiwanie</CardTitle>
          <CardDescription>
            Szukaj po adresie, budynku, numerze, właścicielu, mieście lub ID
            zewnętrznym
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApartmentSearchForm
            key={search}
            defaultSearch={search}
            onSearch={(nextSearch) => {
              updateURL({ search: nextSearch });
            }}
          />
        </CardContent>
      </Card>

      {!loading && (
        <div className="mb-4 text-sm text-muted-foreground">
          Znaleziono {total ?? 0} {pluralizePl(total ?? 0, APARTMENT_FORMS)}
        </div>
      )}

      <ViewTransition view={viewMode}>
        {loading ? (
          <LoadingCard />
        ) : viewMode === ListViewMode.TABLE ? (
          <ApartmentTable
            apartments={apartments}
            hoaId={hoaId}
            duplicateAddresses={duplicateActiveAddresses}
            sort={sort}
            onSort={setSort}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {apartments.map((apartment) => {
              const isDuplicate =
                apartment.isActive &&
                duplicateActiveAddresses.has(buildAddressKey(apartment));
              return (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  hoaId={hoaId}
                  isDuplicate={isDuplicate}
                />
              );
            })}
          </div>
        )}
      </ViewTransition>

      {!loading && apartments.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Nie znaleziono mieszkań</p>
        </div>
      )}

      <InfiniteScrollSentinel
        hasMore={hasMore}
        loading={loadingMore}
        error={error}
        onLoadMore={loadMore}
      />
    </Page>
  );
}
