'use client';

import { ArrowUpDown, Building2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import { renameHoaAction } from '@/actions/apartments/hoa';
import { HoaCardGrid } from '@/components/apartments/hoa-card-grid';
import { HoaGridSkeleton } from '@/components/apartments/hoa-list-skeleton';
import { HoaReorderBar } from '@/components/apartments/hoa-reorder-bar';
import { HoaReorderTable } from '@/components/apartments/hoa-reorder-table';
import { useHoaOrder } from '@/components/apartments/use-hoa-order';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ViewTransition } from '@/components/ui/view-transition';
import type { HoaListItemDto } from '@/lib/hoa/dto/hoa-dto';
import { sortByHoaOrder } from '@/lib/hoa/rules/hoa-order';
import { fetchJson } from '@/lib/platform/swr/fetch-json';
import { SWR_OPTIONS } from '@/lib/platform/swr/swr-options';
import {
  HOA_ACCUSATIVE_FORMS,
  pluralizePl,
} from '@/lib/shared/utils/pluralize';

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
  const [reordering, setReordering] = useState(false);
  const { order, setOrder, resetOrder } = useHoaOrder();

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
  const hoas = useMemo(() => sortByHoaOrder(data ?? [], order), [data, order]);
  // Reordering applies to the whole list, so it is offered only without a search
  const canReorder = startsFromServer && hoas.length > 1;
  const showReorderTable = reordering && canReorder;
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
          <div className="mb-4 flex min-h-9 flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Znaleziono {hoas.length}{' '}
              {pluralizePl(hoas.length, HOA_ACCUSATIVE_FORMS)}
            </p>
            {canReorder && !reordering && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReordering(true)}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Zmień kolejność
              </Button>
            )}
          </div>

          <ViewTransition view={showReorderTable ? 'reorder' : 'cards'}>
            {showReorderTable ? (
              <>
                <HoaReorderBar
                  customized={order.length > 0}
                  onReset={resetOrder}
                  onDone={() => setReordering(false)}
                />
                <HoaReorderTable hoas={hoas} onReorder={setOrder} />
              </>
            ) : (
              <HoaCardGrid
                hoas={hoas}
                sortable={canReorder}
                onReorder={setOrder}
                cardProps={(hoa) => ({
                  hoa,
                  editing: editingId === hoa.id,
                  editingName,
                  onEditingNameChange: setEditingName,
                  onStartEdit: () => startEditing(hoa),
                  onSave: () => saveEdit(hoa.id),
                  onCancel: cancelEditing,
                })}
              />
            )}
          </ViewTransition>

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
