'use client';

import { type ChangeEvent, useState } from 'react';
import useSWRMutation from 'swr/mutation';

import {
  type PreparedImportFile,
  prepareImportFiles,
} from '@/components/import/prepare-import-files';
import { cleanImportQuestion } from '@/components/settlement-import/option-confirmations';
import { useSettlementOptions } from '@/components/settlement-import/use-settlement-options';
import { jsonPoster } from '@/lib/platform/swr/json-mutation';
import type {
  SettlementConfirmation,
  SettlementImportResponse,
  SettlementPreviewResponse,
} from '@/lib/settlements/dto/settlement-import-dto';
import type { SettlementImportOptions } from '@/lib/settlements/types/prepared-file';
import { getErrorMessage } from '@/lib/shared/utils/error-message';

const PREVIEW_URL = '/api/admin/import/settlements/preview';
const IMPORT_URL = '/api/admin/import/settlements';
const PREVIEW_FAILED = 'Podgląd rozliczeń nie powiódł się';
const IMPORT_FAILED = 'Import rozliczeń nie powiódł się';

type Files = { files: PreparedImportFile[] };
type PreviewBody = Files & SettlementImportOptions;

const postPreview = jsonPoster<PreviewBody, SettlementPreviewResponse>(
  PREVIEW_FAILED
);
const postImport = jsonPoster<
  PreviewBody & { confirmations: SettlementConfirmation[] },
  SettlementImportResponse
>(IMPORT_FAILED);

/** A previewed selection: the sent content and what the server found in it. */
interface Preview extends Files {
  response: SettlementPreviewResponse;
}

/** State of the settlement import: selection, preview, confirmations, result. */
export function useSettlementImport(onImported: () => Promise<void>) {
  const { trigger: sendPreview } = useSWRMutation(PREVIEW_URL, postPreview);
  const { trigger: sendImport } = useSWRMutation(IMPORT_URL, postImport);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<SettlementImportResponse | null>(null);
  const [accepted, setAccepted] = useState<SettlementConfirmation[]>([]);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setAccepted([]);
    setError(null);
  };
  // A preview answers for the options it was made with
  const { options, setOption, confirm } = useSettlementOptions(reset);

  async function run(
    step: 'preview' | 'import',
    fallback: string,
    action: () => Promise<void>
  ) {
    setBusy(step);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err, fallback));
    } finally {
      setBusy(null);
    }
  }

  return {
    options,
    setOption,
    files,
    preview: preview?.response ?? null,
    result,
    accepted,
    busy,
    error,
    selectFiles(event: ChangeEvent<HTMLInputElement>) {
      setFiles(Array.from(event.target.files ?? []));
      reset();
    },
    setConfirmation(confirmation: SettlementConfirmation, checked: boolean) {
      setAccepted((current) => {
        const others = current.filter(
          (c) => c.key !== confirmation.key || c.reason !== confirmation.reason
        );
        return checked ? [...others, confirmation] : others;
      });
    },
    runPreview: () =>
      run('preview', PREVIEW_FAILED, async () => {
        reset();
        const prepared = await prepareImportFiles(files);
        const response = await sendPreview({ files: prepared, ...options });
        setPreview({ files: prepared, response });
      }),
    async runImport() {
      if (!preview) return;
      const question = cleanImportQuestion(preview.response.removals);
      if (options.cleanImport && !(await confirm(question))) return;

      await run('import', IMPORT_FAILED, async () => {
        // The previewed content is sent, so that confirmations still apply
        const response = await sendImport({
          files: preview.files,
          confirmations: accepted,
          ...options,
        });
        setResult(response);
        setPreview(null);
        setAccepted([]);
        void onImported();
      });
    },
  };
}
