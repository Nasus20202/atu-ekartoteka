import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { NumberStepper } from '@/components/ui/number-stepper';

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <NumberStepper
      id="stepper"
      value={value}
      min={0}
      max={3}
      onValueChange={setValue}
    />
  );
}

describe('NumberStepper', () => {
  it('increments and decrements the value', () => {
    render(<Harness initial="1" />);
    const input = screen.getByRole('spinbutton');

    fireEvent.click(screen.getByRole('button', { name: 'Zwiększ' }));
    expect(input).toHaveValue(2);

    fireEvent.click(screen.getByRole('button', { name: 'Zmniejsz' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zmniejsz' }));
    expect(input).toHaveValue(0);
  });

  it('disables the buttons at the limits', () => {
    const { rerender } = render(<Harness initial="0" />);
    expect(screen.getByRole('button', { name: 'Zmniejsz' })).toBeDisabled();

    rerender(<Harness key="max" initial="3" />);
    expect(screen.getByRole('button', { name: 'Zwiększ' })).toBeDisabled();
  });

  it('accepts typed values', () => {
    render(<Harness initial="1" />);
    const input = screen.getByRole('spinbutton');

    fireEvent.change(input, { target: { value: '3' } });

    expect(input).toHaveValue(3);
  });

  it('steps from the minimum when the field is empty', () => {
    render(<Harness initial="" />);

    fireEvent.click(screen.getByRole('button', { name: 'Zwiększ' }));

    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });
});
