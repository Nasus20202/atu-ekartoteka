'use client';

import { Building2, Edit2, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { formatImportDate } from '@/app/admin/apartments/hoa-labels';
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
import { Input } from '@/components/ui/input';
import { LoadingCard } from '@/components/ui/loading-card';
import type { HoaListItemDto } from '@/lib/types/dto/hoa-dto';
import {
  APARTMENT_FORMS,
  HOA_ACCUSATIVE_FORMS,
  pluralizePl,
} from '@/lib/utils/pluralize';

export default function ApartmentsPage() {
  const [hoas, setHoas] = useState<HoaListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  async function fetchHOAs(nextSearch: string) {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: nextSearch });
      const response = await fetch(`/api/admin/hoa?${params}`);
      const data = await response.json();
      if (response.ok) {
        setHoas(data.homeownersAssociations);
      }
    } catch (error) {
      console.error('Failed to fetch HOAs:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadHOAs() {
      try {
        const params = new URLSearchParams({ search });
        const response = await fetch(`/api/admin/hoa?${params}`);
        const data = await response.json();
        if (!cancelled && response.ok) {
          setHoas(data.homeownersAssociations);
        }
      } catch (error) {
        console.error('Failed to fetch HOAs:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHOAs();

    return () => {
      cancelled = true;
    };
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchHOAs(search);
  };

  const startEditing = (hoa: HoaListItemDto) => {
    setEditingId(hoa.id);
    setEditingName(hoa.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id: string) => {
    try {
      const response = await fetch('/api/admin/hoa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingName }),
      });
      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        void fetchHOAs(search);
      }
    } catch (error) {
      console.error('Failed to update HOA:', error);
    }
  };

  return (
    <Page maxWidth="7xl">
      <PageHeader
        title="Wspólnoty mieszkaniowe"
        description="Wybierz wspólnotę, aby zobaczyć mieszkania"
        showBackButton={false}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Wyszukiwanie</CardTitle>
          <CardDescription>Szukaj po nazwie lub ID wspólnoty</CardDescription>
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
            Znaleziono {hoas.length}{' '}
            {pluralizePl(hoas.length, HOA_ACCUSATIVE_FORMS)}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hoas.map((hoa) => {
              const aptDate = formatImportDate(hoa.apartmentsDataDate);
              const chgDate = formatImportDate(hoa.chargesDataDate);
              const notDate = formatImportDate(hoa.notificationsDataDate);
              const hasImportDates = aptDate || chgDate || notDate;

              return (
                <Card
                  key={hoa.id}
                  className="hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingId === hoa.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8 mb-2"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(hoa.id);
                              else if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                        ) : (
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span className="truncate">{hoa.name}</span>
                          </CardTitle>
                        )}
                        <CardDescription className="font-mono text-xs">
                          {hoa.externalId}
                        </CardDescription>
                      </div>
                      {editingId === hoa.id ? (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(hoa.id)}
                            className="h-8"
                          >
                            Zapisz
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="h-8"
                          >
                            Anuluj
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(hoa)}
                          className="h-8 shrink-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-3xl font-bold text-primary">
                          {hoa.apartmentCount}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pluralizePl(hoa.apartmentCount, APARTMENT_FORMS)}
                        </p>
                      </div>
                      {hasImportDates && (
                        <div className="text-right space-y-0.5 text-xs text-muted-foreground">
                          {aptDate && <p>Mieszkania: {aptDate}</p>}
                          {chgDate && <p>Naliczenia: {chgDate}</p>}
                          {notDate && <p>Powiadomienia: {notDate}</p>}
                        </div>
                      )}
                    </div>
                    <Link href={`/admin/apartments/${hoa.id}`}>
                      <Button className="w-full">Zobacz mieszkania</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {hoas.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nie znaleziono wspólnot mieszkaniowych
              </p>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
