'use client';

import { HistoryWindowForm } from '@/components/settings/history-window-form';
import { PrivacyPolicyCard } from '@/components/settings/privacy-policy-card';
import { useAppSettings } from '@/components/settings/use-app-settings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SettingsContentProps {
  initialYearsBack: number;
  initialPrivacyPolicy: string | null;
}

export function SettingsContent({
  initialYearsBack,
  initialPrivacyPolicy,
}: SettingsContentProps) {
  const { yearsBack, saving, status, setStatus, save } =
    useAppSettings(initialYearsBack);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historia dla mieszkańców</CardTitle>
          <CardDescription>
            Mieszkańcy widzą bieżący rok i wybraną liczbę poprzednich pełnych
            lat kalendarzowych. Starsze dane pozostają w bazie i są widoczne dla
            administratora.
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
      <PrivacyPolicyCard initialPolicy={initialPrivacyPolicy} />
    </div>
  );
}
