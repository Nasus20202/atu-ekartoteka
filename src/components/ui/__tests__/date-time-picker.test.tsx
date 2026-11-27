import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { DateTimePicker } from '@/components/ui/date-time-picker';

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="when">Termin</label>
      <DateTimePicker
        id="when"
        value={value}
        placeholder="Bez terminu"
        onChange={setValue}
      />
      <output>{value}</output>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Termin' });
const button = (name: string) => screen.getByRole('button', { name });
const output = () => screen.getByRole('status');

describe('DateTimePicker', () => {
  it('shows the placeholder, then the value in Polish', () => {
    const { unmount } = render(<Harness />);
    expect(trigger()).toHaveAccessibleDescription('Bez terminu');
    unmount();

    render(<Harness initial="2026-12-31T10:05" />);
    expect(trigger()).toHaveAccessibleDescription('31 grudnia 2026, 10:05');
  });

  it('ends a newly chosen day at 23:59 and takes another time', async () => {
    render(<Harness initial="2026-12-31T10:05" />);
    await userEvent.click(trigger());
    await userEvent.click(button('Wyczyść'));
    expect(output()).toHaveTextContent('');
    expect(screen.getByRole('textbox', { name: 'Godziny' })).toBeDisabled();

    await userEvent.click(button('Następny miesiąc'));
    await userEvent.click(button('15 stycznia 2027'));

    expect(output()).toHaveTextContent('2027-01-15T23:59');

    await userEvent.click(screen.getByRole('textbox', { name: 'Godziny' }));
    await userEvent.keyboard('08');
    await userEvent.click(screen.getByRole('textbox', { name: 'Minuty' }));
    await userEvent.keyboard('30');

    expect(output()).toHaveTextContent('2027-01-15T08:30');
  });

  it('keeps the time when the day changes and closes on Gotowe', async () => {
    render(<Harness initial="2026-12-31T10:05" />);
    await userEvent.click(trigger());

    await userEvent.click(button('15 grudnia 2026'));
    await userEvent.click(button('Gotowe'));

    expect(output()).toHaveTextContent('2026-12-15T10:05');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});
