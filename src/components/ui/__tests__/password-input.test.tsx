import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PasswordInput } from '@/components/ui/password-input';

describe('PasswordInput', () => {
  it('masks the value and names the toggle', () => {
    render(<PasswordInput id="password" value="secret" onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('secret')).toHaveAttribute(
      'type',
      'password'
    );
    expect(
      screen.getByRole('button', { name: 'Pokaż hasło' })
    ).toBeInTheDocument();
  });

  it('reveals and re-hides the value', async () => {
    const user = userEvent.setup();
    render(<PasswordInput id="password" value="secret" onChange={vi.fn()} />);

    const input = screen.getByDisplayValue('secret');

    await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Ukryj hasło' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ukryj hasło' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('passes native input props through', () => {
    render(
      <PasswordInput
        id="password"
        value="secret"
        autoComplete="new-password"
        required
        minLength={8}
        aria-describedby="password-hint"
        placeholder="Wprowadź hasło"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Wprowadź hasło');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('minlength', '8');
    expect(input).toHaveAttribute('aria-describedby', 'password-hint');
  });

  it('reports the typed value through onChange', () => {
    const onChange = vi.fn();
    render(<PasswordInput id="password" value="initial" onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue('initial'), {
      target: { value: 'new-secret' },
    });

    expect(onChange).toHaveBeenCalledWith('new-secret');
  });

  it('does not submit the surrounding form when toggling', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <PasswordInput id="password" value="secret" onChange={vi.fn()} />
      </form>
    );

    await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
