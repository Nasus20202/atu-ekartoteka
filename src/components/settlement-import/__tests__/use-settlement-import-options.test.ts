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

const selection = (...files: File[]) =>
  ({ target: { files } }) as unknown as ChangeEvent<HTMLInputElement>;

async function previewed() {
  const hook = renderHook(() => useSettlementImport(mocks.refresh));
  act(() => hook.result.current.selectFiles(selection(new File([], 'a.pdf'))));
  await act(() => hook.result.current.runPreview());
  return hook.result;
}

describe('useSettlementImport options', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prepare.mockResolvedValue(PREPARED);
    mocks.preview.mockResolvedValue(PREVIEW);
    mocks.import.mockResolvedValue({ success: true, files: [] });
  });

  it('previews again with an option the admin confirmed', async () => {
    mocks.confirm.mockResolvedValue(true);
    const result = await previewed();

    await act(() => result.current.setOption('cleanImport', true));

    expect(mocks.confirm).toHaveBeenCalledTimes(2);
    expect(result.current.preview).toBeNull();
    await act(() => result.current.runPreview());
    expect(mocks.preview).toHaveBeenLastCalledWith({
      files: PREPARED,
      ...STANDARD,
      cleanImport: true,
    });
  });

  it('keeps the option off when a confirmation is refused', async () => {
    mocks.confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const result = await previewed();

    await act(() => result.current.setOption('skipValidation', true));

    expect(result.current.options).toEqual(STANDARD);
    expect(result.current.preview).not.toBeNull();
  });

  it('switches an option off without asking', async () => {
    mocks.confirm.mockResolvedValue(true);
    const result = await previewed();
    await act(() => result.current.setOption('skipValidation', true));
    mocks.confirm.mockClear();

    await act(() => result.current.setOption('skipValidation', false));

    expect(result.current.options).toEqual(STANDARD);
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it.each([
    [false, 0],
    [true, 1],
  ])(
    'runs a clean import only when confirmed: %s',
    async (confirmed, calls) => {
      mocks.confirm.mockResolvedValue(true);
      mocks.preview.mockResolvedValue({ files: [], removals: 3 });
      const result = await previewed();
      await act(() => result.current.setOption('cleanImport', true));
      await act(() => result.current.runPreview());
      mocks.confirm.mockResolvedValue(confirmed);

      await act(() => result.current.runImport());

      expect(mocks.confirm).toHaveBeenLastCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('do usunięcia: 3.'),
        })
      );
      expect(mocks.import).toHaveBeenCalledTimes(calls);
    }
  );
});
