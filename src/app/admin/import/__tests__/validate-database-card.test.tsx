import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ValidateDatabaseCard } from '@/app/admin/import/validate-database-card';

const VALIDATION_RESPONSE = {
  success: true,
  results: [],
  errors: [],
  fullValidationSkipped: true,
};

describe('ValidateDatabaseCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs the full validation by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...VALIDATION_RESPONSE,
        fullValidationSkipped: false,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ValidateDatabaseCard />);
    fireEvent.click(screen.getByRole('button', { name: /Waliduj dane/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ skipFullValidation: false })
    );
  });

  it('sends the skip option when the full validation checkbox is checked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => VALIDATION_RESPONSE,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ValidateDatabaseCard />);
    fireEvent.click(screen.getByLabelText('Pomiń pełną walidację'));
    fireEvent.click(screen.getByRole('button', { name: /Waliduj dane/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ skipFullValidation: true })
    );
    expect(
      await screen.findByText(/Pełna walidacja pominięta — salda lat są zgodne/)
    ).toBeVisible();
  });
});
