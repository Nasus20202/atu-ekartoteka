import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Select } from '@/components/ui/select';

const OPTIONS = [
  { value: 'TENANT', label: 'Uzytkownik' },
  { value: 'ADMIN', label: 'Administrator' },
] as const;

function TestSelect({
  initialValue = 'TENANT',
  onValueChange,
}: {
  initialValue?: 'TENANT' | 'ADMIN';
  onValueChange?: (value: 'TENANT' | 'ADMIN') => void;
}) {
  const [value, setValue] = useState<'TENANT' | 'ADMIN'>(initialValue);

  return (
    <Select
      aria-label="Rola"
      value={value}
      options={OPTIONS}
      onValueChange={(nextValue) => {
        const typedValue = nextValue as 'ADMIN' | 'TENANT';
        setValue(typedValue);
        onValueChange?.(typedValue);
      }}
    />
  );
}

describe('Select', () => {
  it('renders selected option in the trigger', () => {
    render(<TestSelect />);

    expect(screen.getByRole('button', { name: 'Rola' })).toHaveTextContent(
      'Uzytkownik'
    );
  });

  it('applies default classes', () => {
    render(<TestSelect />);

    expect(screen.getByRole('button', { name: 'Rola' })).toHaveClass(
      'inline-flex',
      'rounded-md',
      'border'
    );
  });

  it('shows options when opened', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('button', { name: 'Rola' }));

    const option = screen.getByRole('menuitemradio', { name: 'Administrator' });

    expect(option).toBeInTheDocument();
    expect(option).toHaveClass('ui-select-option');
  });

  it('adds open-state animation hook to the trigger icon', () => {
    render(<TestSelect />);

    expect(screen.getByRole('button', { name: 'Rola' })).toHaveClass(
      'data-[state=open]:[&_svg]:rotate-180'
    );
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);

    await user.click(screen.getByRole('button', { name: 'Rola' }));
    await user.click(
      screen.getByRole('menuitemradio', { name: 'Administrator' })
    );

    expect(screen.getByRole('button', { name: 'Rola' })).toHaveTextContent(
      'Administrator'
    );
  });

  it('calls onValueChange handler', async () => {
    const handleValueChange = vi.fn();
    const user = userEvent.setup();

    render(<TestSelect onValueChange={handleValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Rola' }));
    await user.click(
      screen.getByRole('menuitemradio', { name: 'Administrator' })
    );

    expect(handleValueChange).toHaveBeenCalledWith('ADMIN');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();

    render(
      <Select
        ref={ref}
        aria-label="Rola"
        value="TENANT"
        options={OPTIONS}
        onValueChange={() => {}}
      />
    );

    expect(ref).toHaveBeenCalled();
  });
});
