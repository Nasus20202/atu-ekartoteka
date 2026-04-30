import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminImportPage from '@/app/admin/import/page';

const confirmMock = vi.fn();

vi.mock('@/components/layout/page', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@/components/providers/confirm-dialog', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    id: string;
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));

global.fetch = vi.fn();

class CompressionStreamMock {
  constructor(format: string) {
    void format;
  }
}

globalThis.CompressionStream =
  CompressionStreamMock as typeof CompressionStream;

Object.defineProperty(Blob.prototype, 'stream', {
  configurable: true,
  value() {
    return {
      pipeThrough: () => 'compressed-stream',
    };
  },
});

describe('AdminImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmMock.mockResolvedValue(true);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        hoa: 1,
        apartments: 2,
        charges: 3,
        notifications: 4,
        payments: 5,
        users: 6,
      }),
    } as Response);
  });

  it('loads and displays database stats', async () => {
    render(<AdminImportPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/stats');
    });

    expect(screen.getByText(/stan bazy danych/i)).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('asks for double confirmation before enabling skip validation', async () => {
    const user = userEvent.setup();
    render(<AdminImportPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/stats');
    });

    await user.click(screen.getByLabelText(/pomiń walidację/i));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByLabelText(/pomiń walidację/i)).toBeChecked();
  });

  it('keeps skip validation disabled when first confirmation is rejected', async () => {
    const user = userEvent.setup();
    confirmMock.mockResolvedValueOnce(false);

    render(<AdminImportPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/stats');
    });

    await user.click(screen.getByLabelText(/pomiń walidację/i));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByLabelText(/pomiń walidację/i)).not.toBeChecked();
  });

  it('keeps skip validation disabled when second confirmation is rejected', async () => {
    const user = userEvent.setup();
    confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    render(<AdminImportPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/stats');
    });

    await user.click(screen.getByLabelText(/pomiń walidację/i));

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByLabelText(/pomiń walidację/i)).not.toBeChecked();
  });

  it('allows disabling skip validation without confirmation', async () => {
    const user = userEvent.setup();
    render(<AdminImportPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/stats');
    });

    await user.click(screen.getByLabelText(/pomiń walidację/i));
    await waitFor(() => {
      expect(screen.getByLabelText(/pomiń walidację/i)).toBeChecked();
    });

    confirmMock.mockClear();
    await user.click(screen.getByLabelText(/pomiń walidację/i));

    expect(confirmMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/pomiń walidację/i)).not.toBeChecked();
  });

  it('cancels clean import when confirmation is rejected', async () => {
    const user = userEvent.setup();
    confirmMock.mockResolvedValueOnce(false);

    render(<AdminImportPage />);

    const input = screen.getByLabelText(/folder z danymi/i);
    const file = new File(['hello'], 'lok.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi
        .fn()
        .mockResolvedValue(new TextEncoder().encode('hello').buffer),
    });

    fireEvent.change(input, { target: { files: [file] } });
    await user.click(screen.getByLabelText(/czysty import/i));
    await user.click(
      screen.getByRole('button', { name: /importuj \(z usunięciem danych\)/i })
    );

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('imports files and shows success state', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hoa: 1,
          apartments: 2,
          charges: 3,
          notifications: 4,
          payments: 5,
          users: 6,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          results: [],
          errors: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hoa: 1,
          apartments: 2,
          charges: 3,
          notifications: 4,
          payments: 5,
          users: 6,
        }),
      } as Response);

    render(<AdminImportPage />);

    const input = screen.getByLabelText(/folder z danymi/i);
    const file = new File(['hello'], 'lok.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi
        .fn()
        .mockResolvedValue(new TextEncoder().encode('hello').buffer),
    });

    fireEvent.change(input, { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: /^importuj$/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/import',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(
      screen.getByText(/import zakończony pomyślnie/i)
    ).toBeInTheDocument();
  });

  it('shows api error when import fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hoa: 1,
          apartments: 2,
          charges: 3,
          notifications: 4,
          payments: 5,
          users: 6,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Import nieudany' }),
      } as Response);

    render(<AdminImportPage />);

    const input = screen.getByLabelText(/folder z danymi/i);
    const file = new File(['hello'], 'lok.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi
        .fn()
        .mockResolvedValue(new TextEncoder().encode('hello').buffer),
    });

    fireEvent.change(input, { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: /^importuj$/i }));

    await waitFor(() => {
      expect(screen.getByText(/import nieudany/i)).toBeInTheDocument();
    });
  });
});
