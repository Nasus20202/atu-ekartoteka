'use client';

import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STEP = 1;

interface NumberStepperProps {
  id?: string;
  value: string;
  min: number;
  max: number;
  onValueChange: (value: string) => void;
  decrementLabel?: string;
  incrementLabel?: string;
  className?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Whole-number input with styled −/+ buttons instead of native spinners. */
export function NumberStepper({
  id,
  value,
  min,
  max,
  onValueChange,
  decrementLabel = 'Zmniejsz',
  incrementLabel = 'Zwiększ',
  className,
}: NumberStepperProps) {
  const parsed = Number.parseInt(value, 10);
  const current = Number.isNaN(parsed) ? min : parsed;

  function step(delta: number) {
    onValueChange(String(clamp(current + delta, min, max)));
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={decrementLabel}
        disabled={current <= min}
        onClick={() => step(-STEP)}
      >
        <Minus />
      </Button>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={STEP}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="w-16 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={incrementLabel}
        disabled={current >= max}
        onClick={() => step(STEP)}
      >
        <Plus />
      </Button>
    </div>
  );
}
