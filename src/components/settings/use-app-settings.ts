'use client';

import { useEffect, useState } from 'react';

const SETTINGS_URL = '/api/admin/settings';
const SAVE_ERROR = 'Nie udało się zapisać ustawień';
const LOAD_ERROR = 'Nie udało się pobrać ustawień';

export type SaveStatus =
  { kind: 'idle' } | { kind: 'saved' } | { kind: 'error'; message: string };

export function useAppSettings() {
  const [yearsBack, setYearsBack] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(SETTINGS_URL);
        if (cancelled) return;
        if (!response.ok) {
          setLoadError(LOAD_ERROR);
          return;
        }
        const data = await response.json();
        setYearsBack(data.tenantHistoryYearsBack);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        if (!cancelled) setLoadError(LOAD_ERROR);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

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

  return { yearsBack, loadError, saving, status, setStatus, save };
}
