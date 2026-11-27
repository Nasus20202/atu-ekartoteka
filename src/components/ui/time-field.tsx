'use client';

import { type KeyboardEvent, useState } from 'react';

import { Input } from '@/components/ui/input';

const STEPS: Record<string, number> = { ArrowUp: 1, ArrowDown: -1 };

const pad = (value: number) => String(value).padStart(2, '0');

interface TimeFieldProps {
  label: string;
  value: number | null;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

/** Hours or minutes typed as two digits; the arrows step through the range. */
export function TimeField({
  label,
  value,
  max,
  disabled,
  onChange,
}: TimeFieldProps) {
  // What is being typed; null shows the stored value
  const [draft, setDraft] = useState<string | null>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    const step = STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    setDraft(null);
    const from = value ?? (step > 0 ? max : 0);
    onChange((from + step + max + 1) % (max + 1));
  };

  return (
    <Input
      aria-label={label}
      inputMode="numeric"
      className="w-14 text-center tabular-nums"
      placeholder="--"
      disabled={disabled}
      value={draft ?? (value === null ? '' : pad(value))}
      onFocus={(event) => event.target.select()}
      onBlur={() => setDraft(null)}
      onKeyDown={onKeyDown}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '').slice(-2);
        setDraft(digits);
        if (digits && Number(digits) <= max) onChange(Number(digits));
      }}
    />
  );
}
