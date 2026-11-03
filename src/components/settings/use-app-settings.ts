'use client';

import { useState } from 'react';

const SETTINGS_URL = '/api/admin/settings';
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
      const response = await fetch(SETTINGS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantHistoryYearsBack: nextYearsBack }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus({ kind: 'error', message: data.error ?? SAVE_ERROR });
        return;
      }

      setYearsBack(data.tenantHistoryYearsBack);
      setStatus({ kind: 'saved' });
    } catch {
      setStatus({ kind: 'error', message: SAVE_ERROR });
    } finally {
      setSaving(false);
    }
  }

  return { yearsBack, saving, status, setStatus, save };
}
