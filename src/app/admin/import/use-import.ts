'use client';

import { useState } from 'react';

import {
  CLEAN_IMPORT_CONFIRMATION,
  CLEAN_IMPORT_FINAL_CONFIRMATION,
  CLEAN_IMPORT_WARNING,
  SKIP_VALIDATION_CONFIRMATION,
  SKIP_VALIDATION_FINAL_CONFIRMATION,
} from '@/app/admin/import/import-confirmations';
import { prepareImportFiles } from '@/app/admin/import/prepare-import-files';
import type { ImportResponse } from '@/app/admin/import/types';
import {
  type ConfirmOptions,
  useConfirm,
} from '@/components/providers/confirm-dialog';
import { getErrorMessage } from '@/lib/utils/error-message';

const IMPORT_FAILED_MESSAGE = 'Import nie powiódł się';

/** State and handlers driving the data import form. */
export function useImport(fetchStats: () => Promise<void>) {
  const confirm = useConfirm();
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cleanImport, setCleanImport] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(event.target.files);
      setResponse(null);
      setError(null);
    }
  }

  async function handleImport() {
    if (!files) {
      return;
    }

    if (cleanImport) {
      const confirmed = await confirm(CLEAN_IMPORT_CONFIRMATION);

      if (!confirmed) {
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const fileData = await prepareImportFiles(files);

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: fileData, cleanImport, skipValidation }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || IMPORT_FAILED_MESSAGE);
      }

      setResponse(data);
      if (data.success) {
        await fetchStats();
      }
    } catch (err) {
      setError(getErrorMessage(err, IMPORT_FAILED_MESSAGE));
    } finally {
      setLoading(false);
    }
  }

  // Each step is shown only after the previous one is confirmed
  async function confirmSteps(steps: ConfirmOptions[]) {
    for (const step of steps) {
      const confirmed = await confirm(step);

      if (!confirmed) {
        return false;
      }
    }

    return true;
  }

  async function handleSkipValidationChange(checked: boolean) {
    if (
      checked &&
      !(await confirmSteps([
        SKIP_VALIDATION_CONFIRMATION,
        SKIP_VALIDATION_FINAL_CONFIRMATION,
      ]))
    ) {
      return;
    }

    setSkipValidation(checked);
  }

  async function handleCleanImportChange(checked: boolean) {
    if (
      checked &&
      !(await confirmSteps([
        CLEAN_IMPORT_WARNING,
        CLEAN_IMPORT_FINAL_CONFIRMATION,
      ]))
    ) {
      return;
    }

    setCleanImport(checked);
  }

  return {
    files,
    loading,
    response,
    error,
    cleanImport,
    skipValidation,
    handleFileChange,
    handleImport,
    handleCleanImportChange,
    handleSkipValidationChange,
  };
}
