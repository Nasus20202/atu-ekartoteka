import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TimeField } from '@/components/ui/time-field';

const onChange = vi.fn();

function Harness() {
  const [value, setValue] = useState(23);
  return (
    <TimeField
      label="Godziny"
      max={23}
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
    />
  );
}

const field = () => screen.getByRole('textbox', { name: 'Godziny' });

describe('TimeField', () => {
  it('takes two typed digits', async () => {
    render(<Harness />);

    await userEvent.click(field());
    await userEvent.keyboard('14');

    expect(field()).toHaveValue('14');
    expect(onChange).toHaveBeenLastCalledWith(14);
  });

  it('steps through the range with the arrows', async () => {
    render(<Harness />);
    await userEvent.click(field());

    await userEvent.keyboard('{ArrowUp}');
    expect(field()).toHaveValue('00');

    await userEvent.keyboard('{ArrowDown}');
    expect(field()).toHaveValue('23');
  });

  it('drops a value outside the range on leaving', async () => {
    onChange.mockClear();
    render(<Harness />);
    await userEvent.click(field());

    await userEvent.keyboard('99');
    await userEvent.tab();

    expect(field()).toHaveValue('09');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('is empty without a value', () => {
    render(
      <TimeField label="Minuty" max={59} value={null} onChange={onChange} />
    );

    expect(screen.getByRole('textbox', { name: 'Minuty' })).toHaveValue('');
  });

  it.each([
    ['{ArrowUp}', 0],
    ['{ArrowDown}', 59],
  ])('starts an empty field with %s at %i', async (key, expected) => {
    onChange.mockClear();
    render(
      <TimeField label="Minuty" max={59} value={null} onChange={onChange} />
    );
    await userEvent.click(screen.getByRole('textbox', { name: 'Minuty' }));

    await userEvent.keyboard(key);

    expect(onChange).toHaveBeenCalledWith(expected);
  });
});
