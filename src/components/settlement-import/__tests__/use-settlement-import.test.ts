import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  prepare: vi.fn(),
  preview: vi.fn(),
  import: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/components/import/prepare-import-files', () => ({
  prepareImportFiles: mocks.prepare,
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('swr/mutation', () => ({
  default: (url: string) => ({
    trigger: url.endsWith('preview') ? mocks.preview : mocks.import,
  }),
}));

import { useSettlementImport } from '@/components/settlement-import/use-settlement-import';

const PREPARED = [{ name: 'a.pdf', path: 'a.pdf', content: 'x' }];
const PREVIEW = { files: [], removals: 0 };
const STANDARD = { cleanImport: false, skipValidation: false };
const CONFIRMATION = { key: 'k', reason: 'replace' } as const;

const selection = (...files: File[]) =>
  ({ target: { files } }) as unknown as ChangeEvent<HTMLInputElement>;

async function previewed() {
  const hook = renderHook(() => useSettlementImport(mocks.refresh));
  act(() => hook.result.current.selectFiles(selection(new File([], 'a.pdf'))));
  await act(() => hook.result.current.runPreview());
  return hook.result;
}

describe('useSettlementImport', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prepare.mockResolvedValue(PREPARED);
    mocks.preview.mockResolvedValue(PREVIEW);
    mocks.import.mockResolvedValue({ success: true, files: [] });
  });

  it('previews the selected files', async () => {
    const result = await previewed();

    expect(mocks.preview).toHaveBeenCalledWith({
      files: PREPARED,
      ...STANDARD,
    });
    expect(result.current.preview).toBe(PREVIEW);
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(result.current.busy).toBeNull();
  });

  it('imports the previewed content with the accepted confirmations', async () => {
    const result = await previewed();
    act(() => result.current.setConfirmation(CONFIRMATION, true));
    act(() =>
      result.current.setConfirmation(
        { key: 'k', reason: 'owner-annotation' },
        true
      )
    );
    act(() =>
      result.current.setConfirmation(
        { key: 'k', reason: 'owner-annotation' },
        false
      )
    );

    await act(() => result.current.runImport());

    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.import).toHaveBeenCalledWith({
      files: PREPARED,
      confirmations: [CONFIRMATION],
      ...STANDARD,
    });
    expect(result.current.result?.success).toBe(true);
    expect(result.current.preview).toBeNull();
    expect(result.current.accepted).toEqual([]);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('drops the preview and confirmations when other files are chosen', async () => {
    const result = await previewed();
    act(() => result.current.setConfirmation(CONFIRMATION, true));

    act(() => result.current.selectFiles(selection()));

    expect(result.current.files).toEqual([]);
    expect(result.current.preview).toBeNull();
    expect(result.current.accepted).toEqual([]);
  });

  it('has no files when the input reports none', async () => {
    const result = await previewed();

    act(() =>
      result.current.selectFiles({
        target: { files: null },
      } as unknown as ChangeEvent<HTMLInputElement>)
    );

    expect(result.current.files).toEqual([]);
  });

  it('does not import without a preview', async () => {
    const { result } = renderHook(() => useSettlementImport(mocks.refresh));

    await act(() => result.current.runImport());

    expect(mocks.import).not.toHaveBeenCalled();
  });

  it.each([
    [new Error('Za duże pliki'), 'Za duże pliki'],
    ['unknown', 'Podgląd rozliczeń nie powiódł się'],
  ])('shows why the preview failed', async (failure, message) => {
    mocks.preview.mockRejectedValue(failure);

    const result = await previewed();

    expect(result.current.error).toBe(message);
    expect(result.current.preview).toBeNull();
  });

  it('keeps the preview when the import fails', async () => {
    mocks.import.mockRejectedValue(new Error('Błąd serwera'));
    const result = await previewed();

    await act(() => result.current.runImport());

    expect(result.current.error).toBe('Błąd serwera');
    expect(result.current.preview).toBe(PREVIEW);
  });
});
