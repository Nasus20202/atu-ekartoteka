'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { ApartmentCard } from '@/app/admin/apartments/[hoaId]/apartment-card';
import {
  buildAddressKey,
  computeDuplicateActiveAddresses,
} from '@/app/admin/apartments/[hoaId]/apartment-list-utils';
import { ApartmentSearchForm } from '@/app/admin/apartments/[hoaId]/apartment-search-form';
import { ApartmentsPagination } from '@/app/admin/apartments/[hoaId]/apartments-pagination';
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
import { LoadingCard } from '@/components/ui/loading-card';
import { APARTMENT_FORMS, pluralizePl } from '@/lib/utils/pluralize';

export default function HOAApartmentsPage() {
  const params = useParams();
  const hoaId = params.hoaId as string;
  const {
    apartments,
    hoa,
    pagination,
    loading,
    search,
    activeOnly,
    updateURL,
  } = useHoaApartments(hoaId);

  const duplicateActiveAddresses = useMemo(
    () => computeDuplicateActiveAddresses(apartments),
    [apartments]
  );

  const handleActiveOnlyChange = (checked: boolean) => {
    updateURL({ activeOnly: checked.toString(), page: '1' });
  };

  const goToPage = (p: number) => {
    updateURL({ page: p.toString() });
  };

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title={hoa ? hoa.name : 'Wspólnota'}
        description={hoa ? hoa.externalId : undefined}
        showBackButton={true}
        action={
          <div className="shrink-0">
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
              updateURL({ search: nextSearch, page: '1' });
            }}
          />
        </CardContent>
      </Card>

      {loading ? (
        <LoadingCard />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Znaleziono {pagination.total}{' '}
            {pluralizePl(pagination.total, APARTMENT_FORMS)}
          </div>

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

          {apartments.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nie znaleziono mieszkań</p>
            </div>
          )}

          <ApartmentsPagination
            pagination={pagination}
            onPageChange={goToPage}
          />
        </>
      )}
    </Page>
  );
}
