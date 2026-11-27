import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  preview: vi.fn(),
  import: vi.fn(),
  refresh: vi.fn(),
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

import {
  bad,
  good,
  record,
} from '@/__tests__/helpers/settlement-pdf/preview-files';
import { SettlementImportCard } from '@/components/settlement-import/settlement-import-card';
import type { SettlementPreviewFileDto } from '@/lib/settlements/dto/settlement-import-dto';

async function preview(...files: SettlementPreviewFileDto[]) {
  mocks.preview.mockResolvedValue({ files, removals: 0 });
  const user = userEvent.setup();
  render(<SettlementImportCard onImported={mocks.refresh} />);
  await user.upload(
    screen.getByLabelText('Pliki PDF'),
    new File(['x'], 'good.pdf', { type: 'application/pdf' })
  );
  await user.click(screen.getByRole('button', { name: 'Sprawdź pliki' }));
  return user;
}

const file = (name: string) =>
  within(screen.getByRole('region', { name: `Plik ${name}` }));
const importButton = () =>
  screen.getByRole('button', { name: 'Importuj rozliczenia' });

describe('SettlementImportCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cannot check before files are chosen', () => {
    render(<SettlementImportCard onImported={mocks.refresh} />);

    expect(
      screen.getByRole('button', { name: 'Sprawdź pliki' })
    ).toBeDisabled();
  });

  it('shows each file with its type, findings and records, animated', async () => {
    const user = await preview(good, bad);

    expect(file('good.pdf').getByText('Rozliczenie mediów')).toBeVisible();
    expect(file('good.pdf').getByText(/Strona 3, różnica/)).toBeVisible();
    expect(
      file('good.pdf').getByText('Rozliczeń: 1 (Zmienione: 1)')
    ).toBeVisible();
    expect(file('bad.pdf').getByText('Nierozpoznany')).toBeVisible();
    expect(
      file('bad.pdf').getByText(/nie zostanie zaimportowany/)
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Podgląd rozliczeń' }).parentElement
    ).toHaveClass('motion-safe:animate-view-switch');

    await user.click(
      screen.getByRole('button', {
        name: 'Pokaż rozliczenia z pliku good.pdf',
      })
    );

    expect(screen.getByRole('cell', { name: 'Zmienione' })).toBeVisible();
    expect(
      screen.getByRole('cell', { name: '01.05.2022–30.09.2022' })
    ).toBeVisible();
  });

  it('sends the ticked confirmations and shows the result', async () => {
    mocks.import.mockResolvedValue({
      success: true,
      files: [
        {
          fileName: 'good.pdf',
          imported: true,
          stats: { created: 0, updated: 1, unchanged: 0 },
          errors: [],
          warnings: [],
        },
      ],
    });
    const user = await preview(good);

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Nazwa „Kowalska Anna D” z pliku to właściciel „Kowalska Anna” lokalu TST01-1',
      })
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: 'Zastąp zapisane rozliczenie: TST01-1, Kowalska Anna D',
      })
    );
    await user.click(importButton());

    expect(mocks.import.mock.calls[0][0].confirmations).toEqual([
      { key: 'key-1', reason: 'owner-annotation' },
      { key: 'key-1', reason: 'replace' },
    ]);
    expect(
      screen.getByText('Utworzono: 0, zaktualizowano: 1, bez zmian: 0')
    ).toBeVisible();
    expect(
      screen.getByText('Import rozliczeń zakończony pomyślnie')
    ).toBeVisible();
  });

  it('says that nothing of a rejected file was written', async () => {
    mocks.import.mockResolvedValue({
      success: false,
      files: [{ ...bad, imported: false, stats: {} }],
    });
    const user = await preview(good);

    await user.click(importButton());

    expect(screen.getByText(/Nic z niego nie zostało zapisane/)).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers no import and no confirmations when every file has errors', async () => {
    await preview({ ...bad, records: [record] });

    expect(importButton()).toBeDisabled();
    expect(file('bad.pdf').queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
