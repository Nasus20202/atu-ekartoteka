import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  preview: vi.fn(),
  import: vi.fn(),
  refresh: vi.fn(),
  download: vi.fn(),
}));

vi.mock('@/components/import/prepare-import-files', () => ({
  prepareImportFiles: () => Promise.resolve([]),
}));
vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('swr/mutation', () => ({
  default: (url: string) => ({
    trigger: url.endsWith('preview') ? mocks.preview : mocks.import,
  }),
}));
vi.mock('@/lib/shared/utils/download-file', () => ({
  downloadTextFile: mocks.download,
}));

import { bad, good } from '@/__tests__/helpers/settlement-pdf/preview-files';
import { SettlementImportCard } from '@/components/settlement-import/settlement-import-card';
import type { SettlementPreviewFileDto } from '@/lib/settlements/dto/settlement-import-dto';

async function preview(...files: SettlementPreviewFileDto[]) {
  mocks.preview.mockResolvedValue({ files });
  const user = userEvent.setup();
  render(<SettlementImportCard onImported={mocks.refresh} />);
  await user.upload(
    screen.getByLabelText('Pliki PDF'),
    new File(['x'], 'good.pdf', { type: 'application/pdf' })
  );
  await user.click(screen.getByRole('button', { name: 'Sprawdź pliki' }));
  return user;
}

describe('SettlementImportCard findings and failures', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads the findings as text', async () => {
    const user = await preview(good, bad);

    await user.click(
      screen.getByRole('button', { name: 'Pobierz błędy i ostrzeżenia' })
    );

    expect(mocks.download).toHaveBeenCalledWith(
      expect.stringContaining('OSTRZEŻENIE|str. 3||różnica'),
      'uwagi-import-rozliczen.txt'
    );
  });

  it('shows why a request failed', async () => {
    mocks.preview.mockRejectedValue(new Error('Brak uprawnień'));
    const user = userEvent.setup();
    render(<SettlementImportCard onImported={mocks.refresh} />);
    await user.upload(
      screen.getByLabelText('Pliki PDF'),
      new File(['x'], 'a.pdf', { type: 'application/pdf' })
    );

    await user.click(screen.getByRole('button', { name: 'Sprawdź pliki' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Brak uprawnień');
  });
});
