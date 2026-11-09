import { useCallback, useLayoutEffect, useState } from 'react';

/** Smallest width Turnstile's flexible layout renders at. */
export const TURNSTILE_MIN_WIDTH = 300;
export const TURNSTILE_HEIGHT = 65;

export interface TurnstileFit {
  /** Layout width of the widget; Turnstile fills it. */
  width: number;
  /** Scale that shrinks the widget to the slot's width on narrow screens. */
  scale: number;
  /** Height of the slot after scaling. */
  height: number;
}

export function getTurnstileFit(slotWidth: number): TurnstileFit {
  const width = Math.max(slotWidth, TURNSTILE_MIN_WIDTH);
  const scale = slotWidth > 0 ? slotWidth / width : 1;
  return { width, scale, height: TURNSTILE_HEIGHT * scale };
}

/** Measures the slot the widget sits in and fits the widget to its width. */
export function useTurnstileFit() {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [slotWidth, setSlotWidth] = useState(0);

  const slotRef = useCallback(
    (node: HTMLDivElement | null) => setSlot(node),
    []
  );

  useLayoutEffect(() => {
    if (!slot) return;
    const measure = () => setSlotWidth(slot.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [slot]);

  return { slotRef, fit: getTurnstileFit(slotWidth) };
}
