import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from '@/components/ui/combobox';

const OPTIONS = [
  { value: 'a', label: 'Akacjowa' },
  { value: 'k', label: 'Klonowa' },
  { value: 'l', label: 'Lipowa' },
];

const onValueChange = vi.fn();

function Harness({ options = OPTIONS }: { options?: typeof OPTIONS }) {
  const [search, setSearch] = useState('');
  return (
    <Combobox
      aria-label="Wspólnota"
      value="k"
      selectedLabel="Klonowa"
      options={options.filter(({ label }) => label.includes(search))}
      search={search}
      onSearchChange={setSearch}
      onValueChange={onValueChange}
      placeholder="Wybierz"
      searchLabel="Szukaj"
      listLabel="Wspólnoty"
      emptyMessage="Nic nie pasuje"
    />
  );
}

const open = () =>
  userEvent.click(screen.getByRole('button', { name: 'Wspólnota' }));

describe('Combobox', () => {
  it('describes the trigger with the chosen label', () => {
    render(<Harness />);

    expect(
      screen.getByRole('button', { name: 'Wspólnota' })
    ).toHaveAccessibleDescription('Klonowa');
  });

  it('types into a focused search field with the choice highlighted', async () => {
    render(<Harness />);
    await open();

    const field = screen.getByRole('combobox', { name: 'Szukaj' });
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Klonowa' }).id
    );
  });

  it('chooses with the arrows and Enter, then closes', async () => {
    onValueChange.mockClear();
    render(<Harness />);
    await open();

    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('l');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('chooses the first match of a typed text', async () => {
    onValueChange.mockClear();
    render(<Harness />);
    await open();

    await userEvent.keyboard('Lip{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('l');
  });

  it('chooses a clicked option', async () => {
    onValueChange.mockClear();
    render(<Harness />);
    await open();

    await userEvent.click(screen.getByRole('option', { name: 'Akacjowa' }));

    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('says when nothing matches and forgets the text on closing', async () => {
    onValueChange.mockClear();
    render(<Harness />);
    await open();
    await userEvent.keyboard('zzz{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent('Nic nie pasuje');
    expect(onValueChange).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');
    await open();

    expect(screen.getByRole('combobox', { name: 'Szukaj' })).toHaveValue('');
  });

  it('opens its list, as wide as the trigger, without zooming it', async () => {
    render(<Harness />);
    await open();

    expect(screen.getByRole('dialog')).toHaveClass('[--tw-enter-scale:1]!');
  });
});
