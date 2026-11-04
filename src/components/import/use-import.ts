'use client';

import { useState } from 'react';
import useSWRMutation from 'swr/mutation';

import {
  CLEAN_IMPORT_CONFIRMATION,
  CLEAN_IMPORT_FINAL_CONFIRMATION,
  CLEAN_IMPORT_WARNING,
  SKIP_VALIDATION_CONFIRMATION,
  SKIP_VALIDATION_FINAL_CONFIRMATION,
} from '@/components/import/import-confirmations';
import {
  type PreparedImportFile,
  prepareImportFiles,
} from '@/components/import/prepare-import-files';
import type { ImportResponse } from '@/components/import/types';
import {
  type ConfirmOptions,
  useConfirm,
} from '@/components/providers/confirm-dialog';
import { jsonPoster } from '@/lib/swr/json-mutation';
import { getErrorMessage } from '@/lib/utils/error-message';

const IMPORT_URL = '/api/admin/import';
const IMPORT_FAILED_MESSAGE = 'Import nie powiódł się';

interface ImportBody {
  files: PreparedImportFile[];
  cleanImport: boolean;
  skipValidation: boolean;
}

const runImport = jsonPoster<ImportBody, ImportResponse>(IMPORT_FAILED_MESSAGE);

/** State and handlers driving the data import form. */
export function useImport(fetchStats: () => Promise<void>) {
  const confirm = useConfirm();
  const { trigger: startImport } = useSWRMutation(IMPORT_URL, runImport);
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

      const data = await startImport({
        files: fileData,
        cleanImport,
        skipValidation,
      });

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
