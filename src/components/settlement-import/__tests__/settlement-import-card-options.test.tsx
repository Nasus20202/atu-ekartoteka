import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  preview: vi.fn(),
  import: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => mocks.confirm,
}));
vi.mock('@/components/import/prepare-import-files', () => ({
  prepareImportFiles: () => Promise.resolve([]),
}));
vi.mock('swr/mutation', () => ({
  default: (url: string) => ({
    trigger: url.endsWith('preview') ? mocks.preview : mocks.import,
  }),
}));

import { bad, good } from '@/__tests__/helpers/settlement-pdf/preview-files';
import { SettlementImportCard } from '@/components/settlement-import/settlement-import-card';

const clean = {
  ...good,
  records: good.records.map((r) => ({ ...r, confirmations: [] })),
};
const CLEAN = /^Czysty import rozliczeń/;
const SKIP = 'Pomiń walidację rozliczeń';
const CLEAN_BUTTON = 'Importuj rozliczenia (z usunięciem danych)';

async function previewWith(option: string | RegExp) {
  const user = userEvent.setup();
  render(<SettlementImportCard onImported={mocks.refresh} />);
  await user.click(screen.getByRole('checkbox', { name: option }));
  await user.upload(
    screen.getByLabelText('Pliki PDF'),
    new File(['x'], 'good.pdf', { type: 'application/pdf' })
  );
  await user.click(screen.getByRole('button', { name: 'Sprawdź pliki' }));
  return user;
}

describe('SettlementImportCard options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirm.mockResolvedValue(true);
    mocks.preview.mockResolvedValue({ files: [good], removals: 2 });
  });

  it('says what a clean import removes and how many were removed', async () => {
    mocks.preview.mockResolvedValue({ files: [clean], removals: 2 });
    mocks.import.mockResolvedValue({
      success: true,
      removed: 2,
      files: [],
    });

    const user = await previewWith(CLEAN);

    expect(
      screen.getByText('Czysty import usunie zapisane rozliczenia: 2.')
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: CLEAN_BUTTON }));
    expect(screen.getByText('Usunięto zapisanych rozliczeń: 2')).toBeVisible();
  });

  it('offers no clean import while any file has errors', async () => {
    mocks.preview.mockResolvedValue({ files: [good, bad], removals: 0 });

    await previewWith(CLEAN);

    expect(screen.getByRole('button', { name: CLEAN_BUTTON })).toBeDisabled();
    expect(screen.getByText(/bad\.pdf – błędy: \d+/)).toBeVisible();
    expect(screen.getByText(/usuń z wyboru i sprawdź ponownie/)).toBeVisible();
  });

  it('waits for every confirmation before a clean import', async () => {
    const user = await previewWith(CLEAN);
    const run = () => screen.getByRole('button', { name: CLEAN_BUTTON });
    expect(run()).toBeDisabled();
    expect(
      screen.getByText('good.pdf – niezaznaczone potwierdzenia: 2')
    ).toBeVisible();

    for (const box of within(
      screen.getByRole('group', { name: /Wymagane potwierdzenia/ })
    ).getAllByRole('checkbox')) {
      await user.click(box);
    }

    expect(run()).toBeEnabled();
    expect(
      screen.getByRole('group', { name: 'Wymagane potwierdzenia: 2 z 2' })
    ).toHaveClass('border-emerald-600');
  });

  it('says which confirmations a standard import still misses', async () => {
    const user = userEvent.setup();
    render(<SettlementImportCard onImported={mocks.refresh} />);
    await user.upload(
      screen.getByLabelText('Pliki PDF'),
      new File(['x'], 'good.pdf', { type: 'application/pdf' })
    );
    await user.click(screen.getByRole('button', { name: 'Sprawdź pliki' }));

    expect(screen.getByText(/Niezaznaczone potwierdzenia: 2\./)).toBeVisible();
    expect(
      screen.getByRole('group', { name: 'Wymagane potwierdzenia: 0 z 2' })
    ).toHaveClass('border-amber-500', 'motion-safe:transition-colors');
    expect(
      screen.getByRole('button', { name: 'Importuj rozliczenia' })
    ).toBeEnabled();
  });

  it('says that the warnings do not block without validation', async () => {
    await previewWith(SKIP);

    expect(
      screen.getByText('Walidacja pominięta: ostrzeżenia nie blokują importu.')
    ).toBeVisible();
    expect(mocks.preview.mock.calls[0][0].skipValidation).toBe(true);
  });
});
