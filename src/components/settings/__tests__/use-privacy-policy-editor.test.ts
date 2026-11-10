import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePrivacyPolicyEditor } from '@/components/settings/use-privacy-policy-editor';

const mocks = vi.hoisted(() => ({
  updateSettingsAction: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@/actions/settings/settings', () => ({
  updateSettingsAction: mocks.updateSettingsAction,
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('@/lib/privacy/template', () => ({
  PRIVACY_POLICY_TEMPLATE: '# Szablon\n\nAdministrator: [[nazwa]] [[adres]]',
}));

function setup(initial: string | null = null) {
  return renderHook(() => usePrivacyPolicyEditor(initial));
}

describe('usePrivacyPolicyEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(true);
  });

  it('starts closed, with the published state taken from the saved text', () => {
    expect(setup(null).result.current).toMatchObject({
      open: false,
      isPublished: false,
      draft: '',
      isDirty: false,
    });
    expect(setup('Tekst').result.current).toMatchObject({
      isPublished: true,
      draft: 'Tekst',
    });
  });

  it('opens on the preview tab with the saved text as the draft', () => {
    const { result } = setup('Tekst');

    act(() => result.current.setTab('edit'));
    act(() => result.current.setDraft('Zmiana'));
    act(() => result.current.openEditor());

    expect(result.current).toMatchObject({
      open: true,
      tab: 'preview',
      draft: 'Tekst',
    });
  });

  it('tracks unsaved changes and counts unresolved placeholders', () => {
    const { result } = setup('Tekst');

    act(() => result.current.setDraft('Tekst [[a]] i [[b]]'));

    expect(result.current.isDirty).toBe(true);
    expect(result.current.remainingPlaceholders).toBe(2);

    act(() => result.current.setDraft('Tekst  '));
    expect(result.current.isDirty).toBe(false);
  });

  it('loads the template without asking when the draft is empty', async () => {
    const { result } = setup(null);

    await act(() => result.current.loadTemplate());

    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(result.current.draft).toContain('# Szablon');
    expect(result.current.remainingPlaceholders).toBe(2);
    expect(result.current.tab).toBe('preview');
    expect(mocks.updateSettingsAction).not.toHaveBeenCalled();
  });

  it('asks before replacing existing text and keeps it when declined', async () => {
    mocks.confirm.mockResolvedValue(false);
    const { result } = setup('Moja polityka');

    await act(() => result.current.loadTemplate());

    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(result.current.draft).toBe('Moja polityka');
  });

  it('replaces existing text with the template when confirmed', async () => {
    const { result } = setup('Moja polityka');

    await act(() => result.current.loadTemplate());

    expect(result.current.draft).toContain('# Szablon');
  });

  it('saves the draft, stores what the server returns and closes', async () => {
    mocks.updateSettingsAction.mockResolvedValue({
      ok: true,
      data: { privacyPolicy: 'Nowy tekst' },
    });
    const { result } = setup(null);
    act(() => result.current.openEditor());
    act(() => result.current.setDraft('  Nowy tekst  '));

    await act(() => result.current.save());

    expect(mocks.updateSettingsAction).toHaveBeenCalledWith({
      privacyPolicy: '  Nowy tekst  ',
    });
    expect(result.current).toMatchObject({
      saved: 'Nowy tekst',
      isPublished: true,
      isDirty: false,
      open: false,
      saving: false,
      status: { kind: 'saved' },
    });
  });

  it('unpublishes when the server stores null', async () => {
    mocks.updateSettingsAction.mockResolvedValue({
      ok: true,
      data: { privacyPolicy: null },
    });
    const { result } = setup('Tekst');
    act(() => result.current.setDraft(''));

    await act(() => result.current.save());

    expect(result.current.isPublished).toBe(false);
    expect(result.current.saved).toBe('');
  });

  it('shows the server message and stays open when saving is rejected', async () => {
    mocks.updateSettingsAction.mockResolvedValue({
      ok: false,
      code: 'invalid',
      error: 'Uzupełnij lub usuń pola oznaczone podwójnymi nawiasami',
    });
    const { result } = setup(null);
    act(() => result.current.openEditor());
    act(() => result.current.setDraft('[[x]]'));

    await act(() => result.current.save());

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Uzupełnij lub usuń pola oznaczone podwójnymi nawiasami',
    });
    expect(result.current.open).toBe(true);
    expect(result.current.saved).toBe('');
  });

  it('shows a generic error when the action throws', async () => {
    mocks.updateSettingsAction.mockRejectedValue(new Error('network'));
    const { result } = setup(null);
    act(() => result.current.setDraft('Tekst'));

    await act(() => result.current.save());

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Nie udało się zapisać ustawień',
    });
    expect(result.current.saving).toBe(false);
  });

  it('closes without asking when there are no unsaved changes', async () => {
    const { result } = setup('Tekst');
    act(() => result.current.openEditor());

    await act(() => result.current.requestClose());

    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);
  });

  it('asks before discarding changes and stays open when declined', async () => {
    mocks.confirm.mockResolvedValue(false);
    const { result } = setup('Tekst');
    act(() => result.current.openEditor());
    act(() => result.current.setDraft('Zmiana'));

    await act(() => result.current.requestClose());

    expect(mocks.confirm).toHaveBeenCalledTimes(1);
    expect(result.current.open).toBe(true);
    expect(result.current.draft).toBe('Zmiana');
  });

  it('discards the changes when confirmed', async () => {
    const { result } = setup('Tekst');
    act(() => result.current.openEditor());
    act(() => result.current.setDraft('Zmiana'));

    await act(() => result.current.requestClose());
    expect(result.current.open).toBe(false);

    act(() => result.current.openEditor());
    expect(result.current.draft).toBe('Tekst');
  });
});
