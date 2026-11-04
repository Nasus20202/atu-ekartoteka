import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  prepareImportFiles: vi.fn(),
  startImport: vi.fn(),
  fetchStats: vi.fn(),
}));

vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('@/components/import/prepare-import-files', () => ({
  prepareImportFiles: mocks.prepareImportFiles,
}));
vi.mock('swr/mutation', () => ({
  default: () => ({ trigger: mocks.startImport }),
}));

import { useImport } from '@/components/import/use-import';

const SUCCESS = { success: true, message: 'ok' } as const;

function fileChange(files: unknown[]) {
  return {
    target: { files },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

describe('useImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(true);
    mocks.prepareImportFiles.mockResolvedValue([{ name: 'a.csv' }]);
    mocks.startImport.mockResolvedValue(SUCCESS);
    mocks.fetchStats.mockResolvedValue(undefined);
  });

  it('ignores a file change with no files selected', () => {
    const { result } = renderHook(() => useImport(mocks.fetchStats));

    act(() => result.current.handleFileChange(fileChange([])));

    expect(result.current.files).toBeNull();
  });

  it('keeps the selected files and clears the previous result', () => {
    const { result } = renderHook(() => useImport(mocks.fetchStats));
    const selected = [new File(['x'], 'a.csv')];

    act(() => result.current.handleFileChange(fileChange(selected)));

    expect(result.current.files).toEqual(selected);
    expect(result.current.response).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('does nothing when importing without a file', async () => {
    const { result } = renderHook(() => useImport(mocks.fetchStats));

    await act(() => result.current.handleImport());

    expect(mocks.startImport).not.toHaveBeenCalled();
  });

  it('keeps the clean import off when the admin does not confirm it', async () => {
    mocks.confirm.mockResolvedValue(false);
    const { result } = renderHook(() => useImport(mocks.fetchStats));
    await act(() => result.current.handleCleanImportChange(true));
    act(() =>
      result.current.handleFileChange(fileChange([new File(['x'], 'a.csv')]))
    );

    await act(() => result.current.handleImport());

    expect(result.current.cleanImport).toBe(false);
    expect(mocks.startImport).toHaveBeenCalledWith(
      expect.objectContaining({ cleanImport: false })
    );
  });

  it('does not import when a confirmed clean import is then cancelled at the import step', async () => {
    const { result } = renderHook(() => useImport(mocks.fetchStats));
    await act(() => result.current.handleCleanImportChange(true));
    expect(result.current.cleanImport).toBe(true);

    mocks.confirm.mockResolvedValue(false);
    act(() =>
      result.current.handleFileChange(fileChange([new File(['x'], 'a.csv')]))
    );
    await act(() => result.current.handleImport());

    expect(mocks.startImport).not.toHaveBeenCalled();
  });

  it('imports confirmed files and refreshes the stats after success', async () => {
    const { result } = renderHook(() => useImport(mocks.fetchStats));
    act(() =>
      result.current.handleFileChange(fileChange([new File(['x'], 'a.csv')]))
    );

    await act(() => result.current.handleImport());

    expect(mocks.startImport).toHaveBeenCalledWith({
      files: [{ name: 'a.csv' }],
      cleanImport: false,
      skipValidation: false,
    });
    expect(result.current.response).toEqual(SUCCESS);
    expect(mocks.fetchStats).toHaveBeenCalledOnce();
    expect(result.current.loading).toBe(false);
  });

  it('keeps the stats unchanged when the import reports failure', async () => {
    mocks.startImport.mockResolvedValue({ success: false, message: 'bad' });
    const { result } = renderHook(() => useImport(mocks.fetchStats));
    act(() =>
      result.current.handleFileChange(fileChange([new File(['x'], 'a.csv')]))
    );

    await act(() => result.current.handleImport());

    expect(result.current.response).toMatchObject({ success: false });
    expect(mocks.fetchStats).not.toHaveBeenCalled();
  });

  it('shows the error when the import request throws', async () => {
    mocks.startImport.mockRejectedValue(new Error('Serwer nie odpowiada'));
    const { result } = renderHook(() => useImport(mocks.fetchStats));
    act(() =>
      result.current.handleFileChange(fileChange([new File(['x'], 'a.csv')]))
    );

    await act(() => result.current.handleImport());

    expect(result.current.error).toBe('Serwer nie odpowiada');
    expect(result.current.loading).toBe(false);
  });

  it('turns skip-validation on only after both confirmations', async () => {
    const { result } = renderHook(() => useImport(mocks.fetchStats));

    await act(() => result.current.handleSkipValidationChange(true));

    expect(mocks.confirm).toHaveBeenCalledTimes(2);
    expect(result.current.skipValidation).toBe(true);
  });

  it('keeps skip-validation off when the first confirmation is declined', async () => {
    mocks.confirm.mockResolvedValueOnce(false);
    const { result } = renderHook(() => useImport(mocks.fetchStats));

    await act(() => result.current.handleSkipValidationChange(true));

    expect(mocks.confirm).toHaveBeenCalledOnce();
    expect(result.current.skipValidation).toBe(false);
  });
});
