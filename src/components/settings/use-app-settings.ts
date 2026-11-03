'use client';

import { useState } from 'react';

import { updateSettingsAction } from '@/actions/settings';

const SAVE_ERROR = 'Nie udało się zapisać ustawień';

export type SaveStatus =
  { kind: 'idle' } | { kind: 'saved' } | { kind: 'error'; message: string };

export function useAppSettings(initialYearsBack: number) {
  const [yearsBack, setYearsBack] = useState(initialYearsBack);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  async function save(nextYearsBack: number) {
    setSaving(true);
    try {
      const result = await updateSettingsAction({
        tenantHistoryYearsBack: nextYearsBack,
      });

      if (!result.ok) {
        setStatus({ kind: 'error', message: result.error || SAVE_ERROR });
        return;
      }

      setYearsBack(result.data.tenantHistoryYearsBack);
      setStatus({ kind: 'saved' });
    } catch {
      setStatus({ kind: 'error', message: SAVE_ERROR });
    } finally {
      setSaving(false);
    }
  }

  return { yearsBack, saving, status, setStatus, save };
}
