'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
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
import { Apartment } from '@/lib/types';

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

export default function HOAApartmentsPage() {
  const params = useParams();
  const hoaId = params.hoaId as string;

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [hoa, setHoa] = useState<HOA | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        activeOnly: activeOnly.toString(),
        hoaId,
      });

      const response = await fetch(`/api/admin/apartments?${params}`);
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
  }, [pagination.page, pagination.limit, search, activeOnly, hoaId]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchApartments();
  };

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <Page maxWidth="7xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <PageHeader
            title={hoa ? hoa.name : 'Wspólnota'}
            description={hoa ? hoa.externalId : undefined}
            showBackButton={true}
          />
        </div>
        <div className="flex items-center gap-4">
          <label
            htmlFor="active-only"
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              id="active-only"
              checked={activeOnly}
              onCheckedChange={(checked: boolean) => setActiveOnly(checked)}
            />
            Tylko aktywne
          </label>
        </div>
      </div>

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            {apartments
              .sort((ap1, ap2) => +ap1.number - +ap2.number)
              .map((apartment) => (
                <Card
                  key={apartment.id}
                  className={`transition-all duration-300 hover:shadow-lg ${!apartment.isActive ? 'opacity-60 grayscale' : ''}`}
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
                      {apartment.isActive ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Aktywne
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          Nieaktywne
                        </span>
                      )}
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
              ))}
          </div>

          {apartments.length === 0 && (
            <div className="text-center py-12">
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
                  const page = i + 1;
                  const isNearCurrent =
                    Math.abs(page - pagination.page) <= 2 ||
                    page === 1 ||
                    page === pagination.totalPages;

                  if (!isNearCurrent) {
                    if (
                      page === pagination.page - 3 ||
                      page === pagination.page + 3
                    ) {
                      return (
                        <span key={page} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(page)}
                    >
                      {page}
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
