import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HoaCombobox } from '@/components/votings/hoa-combobox';

const HOAS = [
  { id: 'h1', name: 'Lipowa' },
  { id: 'h2', name: 'Klonowa' },
];

const renderCombobox = (
  value = '',
  allLabel?: string,
  onValueChange = vi.fn()
) =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <HoaCombobox
        aria-label="Wspólnota"
        hoas={HOAS}
        value={value}
        allLabel={allLabel}
        onValueChange={onValueChange}
      />
    </SWRConfig>
  );

const trigger = () => screen.getByRole('button', { name: 'Wspólnota' });
const options = () =>
  screen.getAllByRole('option').map((option) => option.textContent);

describe('HoaCombobox', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks for a choice, or shows the chosen one', () => {
    const { unmount } = renderCombobox();
    expect(trigger()).toHaveAccessibleDescription('Wybierz wspólnotę');
    unmount();

    renderCombobox('h2');
    expect(trigger()).toHaveAccessibleDescription('Klonowa');
  });

  it('offers every association as an extra choice of a filter', async () => {
    renderCombobox('', 'Wszystkie wspólnoty');
    expect(trigger()).toHaveAccessibleDescription('Wszystkie wspólnoty');

    await userEvent.click(trigger());

    expect(options()).toEqual(['Wszystkie wspólnoty', 'Lipowa', 'Klonowa']);
  });

  it('chooses nothing with Enter while the search is still running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const onValueChange = vi.fn();
    renderCombobox('', undefined, onValueChange);
    await userEvent.click(trigger());

    await userEvent.keyboard('klon{Enter}');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
  });

  it('chooses the match with Enter once the search has answered', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ homeownersAssociations: [HOAS[1]] }),
      })
    );
    const onValueChange = vi.fn();
    renderCombobox('', undefined, onValueChange);
    await userEvent.click(trigger());
    await userEvent.keyboard('klon');
    await waitFor(() =>
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'false')
    );

    await userEvent.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('h2');
  });

  it('says when the search fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    renderCombobox();
    await userEvent.click(trigger());

    await userEvent.keyboard('lip');

    expect(
      await screen.findByText('Nie udało się wyszukać wspólnot')
    ).toBeInTheDocument();
  });
});
