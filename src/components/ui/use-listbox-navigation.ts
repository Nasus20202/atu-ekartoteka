import { type KeyboardEvent, useState } from 'react';

const STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };

const scrollIntoView = (element: HTMLElement | null) => {
  element?.scrollIntoView?.({ block: 'nearest' });
};

/**
 * The highlighted option of a list driven from a text field: arrows move it and
 * Enter chooses it. Without a move it is the chosen option, else the first one.
 */
export function useListboxNavigation(
  options: ReadonlyArray<{ value: string }>,
  selected: string,
  onChoose: (value: string) => void
) {
  const [moved, setMoved] = useState<number | null>(null);
  const preferred = options.findIndex(({ value }) => value === selected);
  const activeIndex = options.length
    ? Math.min(moved ?? Math.max(preferred, 0), options.length - 1)
    : -1;

  const onKeyDown = (event: KeyboardEvent) => {
    const step = STEPS[event.key];
    if (step !== undefined) {
      event.preventDefault();
      if (options.length) {
        setMoved((activeIndex + step + options.length) % options.length);
      }
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0) onChoose(options[activeIndex].value);
    }
  };

  return {
    activeIndex,
    activate: setMoved,
    reset: () => setMoved(null),
    onKeyDown,
    scrollIntoView,
  };
}
