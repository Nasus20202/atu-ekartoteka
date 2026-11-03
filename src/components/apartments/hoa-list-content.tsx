'use client';

import { Building2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { HoaListCard } from '@/components/apartments/hoa-list-card';
import { HoaGridSkeleton } from '@/components/apartments/hoa-list-skeleton';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { HoaListItemDto } from '@/lib/types/dto/hoa-dto';
import { HOA_ACCUSATIVE_FORMS, pluralizePl } from '@/lib/utils/pluralize';

interface HoaListContentProps {
  initialHoas: HoaListItemDto[];
}

export function HoaListContent({ initialHoas }: HoaListContentProps) {
  const [hoas, setHoas] = useState<HoaListItemDto[]>(initialHoas);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const skipInitialFetch = useRef(true);
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
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    let cancelled = false;

    async function loadHOAs() {
      try {
        setLoading(true);
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
    <>
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
        <HoaGridSkeleton />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Znaleziono {hoas.length}{' '}
            {pluralizePl(hoas.length, HOA_ACCUSATIVE_FORMS)}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hoas.map((hoa) => (
              <HoaListCard
                key={hoa.id}
                hoa={hoa}
                editing={editingId === hoa.id}
                editingName={editingName}
                onEditingNameChange={setEditingName}
                onStartEdit={() => startEditing(hoa)}
                onSave={() => saveEdit(hoa.id)}
                onCancel={cancelEditing}
              />
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
    </>
  );
}
