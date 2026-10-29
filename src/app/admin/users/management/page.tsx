'use client';

import { CheckCircle, UserCheck, UserPlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  type AccountPreview,
  buildAccountPreviews,
} from '@/app/admin/users/management/account-previews';
import { ApartmentList } from '@/app/admin/users/management/apartment-list';
import {
  type BulkMode,
  formatBulkResult,
  runBulkOperation,
} from '@/app/admin/users/management/bulk-requests';
import { ConfirmCreateDialog } from '@/app/admin/users/management/confirm-create-dialog';
import { useHoaSelection } from '@/app/admin/users/management/use-hoa-selection';
import { useUnassignedHoas } from '@/app/admin/users/management/use-unassigned-hoas';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EMPTY_MESSAGES = {
  assign: {
    text: 'Brak mieszkań do przypisania',
    sub: 'Wszystkie mieszkania z istniejącymi kontami są już przypisane.',
  },
  create: {
    text: 'Brak mieszkań bez kont',
    sub: 'Wszystkie mieszkania mają już przypisane konta użytkowników.',
  },
} as const;

export default function BulkCreateUsersPage() {
  const [mode, setMode] = useState<BulkMode>('create');
  const {
    hoas,
    hasMore,
    loading,
    loadingMore,
    error: loadError,
    reset,
    reload,
    loadMore,
  } = useUnassignedHoas(mode);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [confirmPreviews, setConfirmPreviews] = useState<
    AccountPreview[] | null
  >(null);

  const {
    selectedIds,
    setSelectedIds,
    allIds,
    isHoaSelected,
    isHoaIndeterminate,
    toggleHoa,
    toggleApartment,
    selectIds,
  } = useHoaSelection(hoas);

  const handleModeChange = (nextMode: string) => {
    reset();
    setSelectedIds(new Set());
    setResult(null);
    setOperationError(null);
    setMode(nextMode as BulkMode);
  };

  const runOperation = async (operation: BulkMode) => {
    setSubmitting(true);
    setResult(null);
    setOperationError(null);
    const outcome = await runBulkOperation(operation, Array.from(selectedIds));
    if (outcome.error === undefined) {
      setResult(formatBulkResult(operation, outcome.data));
      setSelectedIds(new Set());
      await reload(operation);
    } else {
      setOperationError(outcome.error);
    }
    setSubmitting(false);
  };

  const handleConfirmCreate = async () => {
    setConfirmPreviews(null);
    await runOperation('create');
  };

  const sharedProps = {
    loading,
    hoas,
    hasMore,
    loadingMore,
    onLoadMore: () => void loadMore(),
    allIds,
    selectedIds,
    submitting,
    isHoaSelected,
    isHoaIndeterminate,
    onToggleHoa: toggleHoa,
    onToggleApartment: toggleApartment,
    onSelectIds: selectIds,
    emptyMessage: EMPTY_MESSAGES[mode],
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

      <Tabs value={mode} onValueChange={handleModeChange} className="space-y-4">
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

        {result && (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}
        {(operationError ?? loadError) && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{operationError ?? loadError}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="create">
          <ApartmentList
            {...sharedProps}
            submitLabel={submitting ? 'Tworzenie...' : 'Utwórz konta'}
            onSubmit={() =>
              setConfirmPreviews(buildAccountPreviews(hoas, selectedIds))
            }
            submitIcon={<UserPlus className="mr-2 h-4 w-4" />}
          />
        </TabsContent>

        <TabsContent value="assign">
          <ApartmentList
            {...sharedProps}
            submitLabel={submitting ? 'Przypisywanie...' : 'Przypisz konta'}
            onSubmit={() => void runOperation('assign')}
            submitIcon={<UserCheck className="mr-2 h-4 w-4" />}
          />
        </TabsContent>
      </Tabs>

      <ConfirmCreateDialog
        previews={confirmPreviews}
        onCancel={() => setConfirmPreviews(null)}
        onConfirm={handleConfirmCreate}
      />
    </Page>
  );
}
