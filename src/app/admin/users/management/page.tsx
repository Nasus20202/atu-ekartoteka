'use client';

import { CheckCircle, UserCheck, UserPlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ApartmentList } from '@/app/admin/users/management/ApartmentList';
import { HoaGroup } from '@/app/admin/users/management/HoaCard';
import { useHoaSelection } from '@/app/admin/users/management/use-hoa-selection';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type BulkMode = 'create' | 'assign';

interface BulkOperationResult {
  created?: number;
  assigned?: number;
  skipped: number;
  errors: number;
}

export default function BulkCreateUsersPage() {
  const [mode, setMode] = useState<BulkMode>('create');
  const [hoas, setHoas] = useState<HoaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createResult, setCreateResult] = useState<BulkOperationResult | null>(
    null
  );
  const [assignResult, setAssignResult] = useState<BulkOperationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const {
    selectedIds,
    setSelectedIds,
    allIds,
    isHoaSelected,
    isHoaIndeterminate,
    toggleHoa,
    toggleApartment,
  } = useHoaSelection(hoas);

  const fetchApartments = async (currentMode: BulkMode) => {
    setLoading(true);
    setHoas([]);
    try {
      const modeParam = currentMode === 'assign' ? 'assignable' : 'creatable';
      const res = await fetch(
        `/api/admin/unassigned-apartments?mode=${modeParam}`
      );
      const data = await res.json();
      if (res.ok) {
        setHoas(data.hoas);
      } else {
        setError(data.error || 'Nie udało się pobrać listy mieszkań');
      }
    } catch {
      setError('Nie udało się pobrać listy mieszkań');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds(new Set());
    setCreateResult(null);
    setAssignResult(null);
    setError(null);
    fetchApartments(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleCreate = async () => {
    setSubmitting(true);
    setCreateResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/users/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateResult(data);
        setSelectedIds(new Set());
        await fetchApartments('create');
      } else {
        setError(data.error || 'Wystąpił błąd podczas tworzenia kont');
      }
    } catch {
      setError('Wystąpił błąd podczas tworzenia kont');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    setSubmitting(true);
    setAssignResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/users/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apartmentIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignResult(data);
        setSelectedIds(new Set());
        await fetchApartments('assign');
      } else {
        setError(data.error || 'Wystąpił błąd podczas przypisywania kont');
      }
    } catch {
      setError('Wystąpił błąd podczas przypisywania kont');
    } finally {
      setSubmitting(false);
    }
  };

  const emptyMsg =
    mode === 'assign'
      ? {
          text: 'Brak mieszkań do przypisania',
          sub: 'Wszystkie mieszkania z istniejącymi kontami są już przypisane.',
        }
      : {
          text: 'Brak mieszkań bez kont',
          sub: 'Wszystkie mieszkania mają już przypisane konta użytkowników.',
        };

  return (
    <Page maxWidth="4xl">
      <PageHeader
        title="Zarządzanie kontami"
        description="Twórz konta lub przypisuj istniejące do mieszkań"
        showBackButton={false}
        action={
          <Button variant="outline" asChild>
            <Link href="/admin/users">Powrót</Link>
          </Button>
        }
      />

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as BulkMode)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="create">
            <UserPlus className="mr-2 h-4 w-4" />
            Utwórz konta
          </TabsTrigger>
          <TabsTrigger value="assign">
            <UserCheck className="mr-2 h-4 w-4" />
            Przypisz istniejące
          </TabsTrigger>
        </TabsList>

        {createResult && (
          <BulkSuccessAlert
            message={`Utworzono ${createResult.created ?? 0} kont. Pominięto ${createResult.skipped}.${createResult.errors > 0 ? ` Błędy: ${createResult.errors}.` : ''}`}
          />
        )}
        {assignResult && (
          <BulkSuccessAlert
            message={`Przypisano ${assignResult.assigned ?? 0} mieszkań. Pominięto ${assignResult.skipped}.${assignResult.errors > 0 ? ` Błędy: ${assignResult.errors}.` : ''}`}
          />
        )}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="create">
          <ApartmentList
            loading={loading}
            hoas={hoas}
            allIds={allIds}
            selectedIds={selectedIds}
            submitting={submitting}
            isHoaSelected={isHoaSelected}
            isHoaIndeterminate={isHoaIndeterminate}
            onToggleHoa={toggleHoa}
            onToggleApartment={toggleApartment}
            emptyMessage={emptyMsg}
            submitLabel={submitting ? 'Tworzenie...' : 'Utwórz konta'}
            onSubmit={handleCreate}
            submitIcon={<UserPlus className="mr-2 h-4 w-4" />}
          />
        </TabsContent>

        <TabsContent value="assign">
          <ApartmentList
            loading={loading}
            hoas={hoas}
            allIds={allIds}
            selectedIds={selectedIds}
            submitting={submitting}
            isHoaSelected={isHoaSelected}
            isHoaIndeterminate={isHoaIndeterminate}
            onToggleHoa={toggleHoa}
            onToggleApartment={toggleApartment}
            emptyMessage={emptyMsg}
            submitLabel={submitting ? 'Przypisywanie...' : 'Przypisz konta'}
            onSubmit={handleAssign}
            submitIcon={<UserCheck className="mr-2 h-4 w-4" />}
          />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

function BulkSuccessAlert({ message }: { message: string }) {
  return (
    <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
