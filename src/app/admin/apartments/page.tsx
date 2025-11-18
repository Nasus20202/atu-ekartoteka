'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Apartment } from '@/lib/types';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
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
      });

      const response = await fetch(`/api/admin/apartments?${params}`);
      const data = await response.json();

      if (response.ok) {
        setApartments(data.apartments);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch apartments:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, activeOnly]);

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
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mieszkania</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Tylko aktywne
            </label>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wyszukiwanie</CardTitle>
            <CardDescription>
              Szukaj po numerze, właścicielu, adresie lub mieście
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
          <div className="text-center text-muted-foreground">Ładowanie...</div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Znaleziono {pagination.total} mieszkań
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {apartments.map((apartment) => (
                <Card
                  key={apartment.id}
                  className={!apartment.isActive ? 'opacity-60 grayscale' : ''}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {apartment.address} {apartment.number}
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
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Budynek:</dt>
                        <dd className="font-medium">{apartment.building}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Powierzchnia:</dt>
                        <dd className="font-medium">{apartment.area} m²</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Wysokość:</dt>
                        <dd className="font-medium">{apartment.height} cm</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                          ID zewnętrzne:
                        </dt>
                        <dd className="font-mono text-xs">
                          {apartment.externalId}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>

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
                          <span
                            key={page}
                            className="px-2 text-muted-foreground"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={
                          page === pagination.page ? 'default' : 'outline'
                        }
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
      </div>
    </div>
  );
}
