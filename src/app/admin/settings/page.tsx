'use client';

import { HistoryWindowForm } from '@/app/admin/settings/history-window-form';
import { useAppSettings } from '@/app/admin/settings/use-app-settings';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingCard } from '@/components/ui/loading-card';

export default function SettingsPage() {
  const { yearsBack, loadError, saving, status, setStatus, save } =
    useAppSettings();

  return (
    <Page maxWidth="4xl">
      <PageHeader title="Ustawienia" showBackButton={false} />

      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : yearsBack === null ? (
        <LoadingCard />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historia dla mieszkańców</CardTitle>
            <CardDescription>
              Mieszkańcy widzą bieżący rok i wybraną liczbę poprzednich pełnych
              lat kalendarzowych. Starsze dane pozostają w bazie i są widoczne
              dla administratora.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryWindowForm
              savedYearsBack={yearsBack}
              saving={saving}
              status={status}
              onEdit={() => setStatus({ kind: 'idle' })}
              onInvalid={(message) => setStatus({ kind: 'error', message })}
              onSave={save}
            />
          </CardContent>
        </Card>
      )}
    </Page>
  );
}
