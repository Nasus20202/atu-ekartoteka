'use client';

import { useState } from 'react';

import { updateSettingsAction } from '@/actions/settings/settings';
import { useConfirm } from '@/components/providers/confirm-dialog';
import type { SaveStatus } from '@/components/settings/use-app-settings';
import { countPlaceholders } from '@/lib/privacy/placeholders';

const SAVE_ERROR = 'Nie udało się zapisać ustawień';

export type EditorTab = 'preview' | 'edit';

/** State of the policy editor: the saved text, the draft and the dialog. */
export function usePrivacyPolicyEditor(initialPolicy: string | null) {
  const confirm = useConfirm();
  const [saved, setSaved] = useState(initialPolicy ?? '');
  const [draft, setDraft] = useState(saved);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<EditorTab>('preview');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });

  const isDirty = draft.trim() !== saved;

  function openEditor() {
    setDraft(saved);
    setTab('preview');
    setStatus({ kind: 'idle' });
    setOpen(true);
  }

  async function requestClose() {
    if (
      isDirty &&
      !(await confirm({
        title: 'Odrzucić zmiany?',
        description:
          'Niezapisane zmiany w polityce prywatności zostaną utracone.',
        confirmText: 'Odrzuć zmiany',
        variant: 'destructive',
      }))
    ) {
      return;
    }
    setOpen(false);
  }

  async function loadTemplate() {
    if (
      draft.trim() &&
      !(await confirm({
        title: 'Zastąpić tekst szablonem?',
        description:
          'Obecny tekst w edytorze zostanie zastąpiony szablonem. Zapisana polityka nie zmieni się, dopóki nie klikniesz „Zapisz”.',
        confirmText: 'Wczytaj szablon',
      }))
    ) {
      return;
    }

    const { PRIVACY_POLICY_TEMPLATE } = await import('@/lib/privacy/template');
    setDraft(PRIVACY_POLICY_TEMPLATE);
    setTab('preview');
    setStatus({ kind: 'idle' });
  }

  async function save() {
    setSaving(true);
    try {
      const result = await updateSettingsAction({ privacyPolicy: draft });

      if (!result.ok) {
        setStatus({ kind: 'error', message: result.error || SAVE_ERROR });
        return;
      }

      setSaved(result.data.privacyPolicy ?? '');
      setStatus({ kind: 'saved' });
      setOpen(false);
    } catch {
      setStatus({ kind: 'error', message: SAVE_ERROR });
    } finally {
      setSaving(false);
    }
  }

  return {
    saved,
    draft,
    setDraft,
    open,
    tab,
    setTab,
    saving,
    status,
    setStatus,
    isDirty,
    isPublished: saved !== '',
    remainingPlaceholders: countPlaceholders(draft),
    openEditor,
    requestClose,
    loadTemplate,
    save,
  };
}

export type PrivacyPolicyEditor = ReturnType<typeof usePrivacyPolicyEditor>;
