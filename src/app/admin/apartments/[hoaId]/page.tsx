'use client';

import { AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LoadingCard } from '@/components/ui/loading-card';
import { type ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HOA {
  id: string;
  externalId: string;
  name: string;
}

function buildAddressKey(apt: ApartmentSummaryDto): string {
  return `${apt.address ?? ''}__${apt.building ?? ''}__${apt.number}`;
}

function computeDuplicateActiveAddresses(
  apartments: ApartmentSummaryDto[]
): Set<string> {
  const counts = new Map<string, number>();
  for (const apt of apartments) {
    if (!apt.isActive) continue;
    const key = buildAddressKey(apt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  for (const [key, count] of counts) {
    if (count > 1) duplicates.add(key);
  }
  return duplicates;
}

export default function HOAApartmentsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hoaId = params.hoaId as string;

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const activeOnly = searchParams.get('activeOnly') === 'true';

  const [apartments, setApartments] = useState<ApartmentSummaryDto[]>([]);
  const [hoa, setHoa] = useState<HOA | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchInput, setSearchInput] = useState(search);
  const [loading, setLoading] = useState(true);

  const duplicateActiveAddresses = useMemo(
    () => computeDuplicateActiveAddresses(apartments),
    [apartments]
  );

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search,
        activeOnly: activeOnly.toString(),
        hoaId,
      });

      const response = await fetch(`/api/admin/apartments?${urlParams}`);
      const data = await response.json();

      if (response.ok) {
        setApartments(data.apartments);
        setPagination(data.pagination);
        if (data.hoa) {
          setHoa(data.hoa);
        }
      }
    } catch (error) {
      console.error('Failed to fetch apartments:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, search, activeOnly, hoaId]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateURL = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`?${newParams}`, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ search: searchInput, page: '1' });
  };

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
                onCheckedChange={handleActiveOnlyChange}
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
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Wyszukaj..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Szukaj</Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingCard />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Znaleziono {pagination.total}{' '}
            {pagination.total === 1
              ? 'mieszkanie'
              : pagination.total < 5 && pagination.total > 1
                ? 'mieszkania'
                : 'mieszkań'}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {apartments.map((apartment) => {
              const isDuplicate =
                apartment.isActive &&
                duplicateActiveAddresses.has(buildAddressKey(apartment));
              return (
                <Card
                  key={apartment.id}
                  className={`transition-all duration-300 hover:shadow-lg ${!apartment.isActive ? 'opacity-60 grayscale' : ''} ${isDuplicate ? 'border-amber-400 dark:border-amber-600' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {apartment.address} {apartment.building}/
                          {apartment.number}
                        </CardTitle>
                        <CardDescription>
                          {apartment.postalCode} {apartment.city}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {apartment.isActive ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            Aktywne
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            Nieaktywne
                          </span>
                        )}
                        {isDuplicate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            Duplikat adresu
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Właściciel:</dt>
                        <dd className="font-medium">{apartment.owner}</dd>
                      </div>
                      {(apartment.shareNumerator ||
                        apartment.shareDenominator) && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Udział:</dt>
                          <dd className="font-medium">
                            {apartment.shareNumerator &&
                            apartment.shareDenominator &&
                            apartment.shareDenominator > 0
                              ? `${Number(
                                  (
                                    (apartment.shareNumerator /
                                      apartment.shareDenominator) *
                                    100
                                  ).toFixed(1)
                                )}%`
                              : '-'}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                          ID zewnętrzne:
                        </dt>
                        <dd className="font-mono text-xs">
                          {apartment.externalApartmentId} /{' '}
                          {apartment.externalOwnerId}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4">
                      <Link href={`/admin/apartments/${hoaId}/${apartment.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Zobacz szczegóły
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {apartments.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nie znaleziono mieszkań</p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Poprzednia
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => {
                  const p = i + 1;
                  const isNearCurrent =
                    Math.abs(p - pagination.page) <= 2 ||
                    p === 1 ||
                    p === pagination.totalPages;

                  if (!isNearCurrent) {
                    if (
                      p === pagination.page - 3 ||
                      p === pagination.page + 3
                    ) {
                      return (
                        <span key={p} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={p}
                      variant={p === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Następna
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
