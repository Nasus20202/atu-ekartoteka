'use client';

import { Building2, Search } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { renameHoaAction } from '@/actions/apartments/hoa';
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
import { fetchJson } from '@/lib/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/swr/swr-options';
import type { HoaListItemDto } from '@/lib/types/dto/hoa-dto';
import { HOA_ACCUSATIVE_FORMS, pluralizePl } from '@/lib/utils/pluralize';

interface HoaListContentProps {
  initialHoas: HoaListItemDto[];
}

const NO_SEARCH = '';

interface HoaListResponse {
  homeownersAssociations: HoaListItemDto[];
}

async function fetchHoas([, search]: readonly [string, string]) {
  const params = new URLSearchParams({ search });
  const data = await fetchJson<HoaListResponse>(`/api/admin/hoa?${params}`);
  return data.homeownersAssociations;
}

export function HoaListContent({ initialHoas }: HoaListContentProps) {
  const [search, setSearch] = useState(NO_SEARCH);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startsFromServer = search === NO_SEARCH;
  const { data, isValidating, mutate } = useSWR(
    ['hoa-list', search] as const,
    fetchHoas,
    {
      ...SWR_OPTIONS,
      fallbackData: startsFromServer ? initialHoas : undefined,
      revalidateOnMount: false,
    }
  );
  const hoas = data ?? [];
  const loading = isValidating && data === undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void mutate();
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
      const result = await renameHoaAction(id, editingName);
      if (result.ok) {
        setEditingId(null);
        setEditingName('');
        void mutate();
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
