'use client';

import { Building2, Edit2, Search } from 'lucide-react';
import Link from 'next/link';
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

interface HOA {
  id: string;
  externalId: string;
  name: string;
  apartmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ApartmentsPage() {
  const [hoas, setHoas] = useState<HOA[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchHOAs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
      });

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
  }, [search]);

  useEffect(() => {
    fetchHOAs();
  }, [fetchHOAs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHOAs();
  };

  const startEditing = (hoa: HOA) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          name: editingName,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        fetchHOAs();
      }
    } catch (error) {
      console.error('Failed to update HOA:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 animate-fade-in">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 animate-slide-in-top">
          <h1 className="text-3xl font-bold">Wspólnoty mieszkaniowe</h1>
          <p className="mt-2 text-muted-foreground">
            Wybierz wspólnotę, aby zobaczyć mieszkania
          </p>
        </div>

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
          <div className="text-center text-muted-foreground">Ładowanie...</div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Znaleziono {hoas.length}{' '}
              {hoas.length === 1
                ? 'wspólnotę'
                : hoas.length < 5
                  ? 'wspólnoty'
                  : 'wspólnot'}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hoas.map((hoa, index) => (
                <Card
                  key={hoa.id}
                  className="hover:shadow-lg transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
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
                              if (e.key === 'Enter') {
                                saveEdit(hoa.id);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
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
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-primary">
                        {hoa.apartmentCount}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hoa.apartmentCount === 1
                          ? 'mieszkanie'
                          : hoa.apartmentCount < 5
                            ? 'mieszkania'
                            : 'mieszkań'}
                      </p>
                    </div>
                    <Link href={`/admin/apartments/${hoa.id}`}>
                      <Button className="w-full">Zobacz mieszkania</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
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
      </div>
    </div>
  );
}
