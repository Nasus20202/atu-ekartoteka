import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';

const LABEL = 'Pobierz PDF naliczeń: Listopad 2025';
const FILE = { blob: new Blob(['pdf']), fileName: 'naliczenia.pdf' };

describe('PdfDownloadButton', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:pdf');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows text in the default variant', () => {
    render(<PdfDownloadButton label={LABEL} createPdf={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Pobierz PDF' })
    ).toBeInTheDocument();
  });

  it('shows only an icon with an accessible label in the compact variant', () => {
    render(<PdfDownloadButton label={LABEL} compact createPdf={vi.fn()} />);

    const button = screen.getByRole('button', { name: LABEL });
    expect(button).toHaveAttribute('title', 'Pobierz PDF');
    expect(button).not.toHaveTextContent('Pobierz PDF');
  });

  it('downloads the created file', async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const createPdf = vi.fn().mockResolvedValue(FILE);

    render(<PdfDownloadButton label={LABEL} compact createPdf={createPdf} />);
    await userEvent.click(screen.getByRole('button', { name: LABEL }));

    expect(createPdf).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledWith(FILE.blob);
    expect(click).toHaveBeenCalledOnce();
  });

  it('is disabled and announces generation while the PDF is created', async () => {
    let resolve: (file: typeof FILE) => void = () => {};
    const createPdf = vi.fn(
      () => new Promise<typeof FILE>((r) => (resolve = r))
    );
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<PdfDownloadButton label={LABEL} compact createPdf={createPdf} />);
    await userEvent.click(screen.getByRole('button', { name: LABEL }));

    const button = screen.getByRole('button', { name: 'Generowanie...' });
    expect(button).toBeDisabled();

    resolve(FILE);
    expect(
      await screen.findByRole('button', { name: LABEL })
    ).not.toBeDisabled();
  });
});
