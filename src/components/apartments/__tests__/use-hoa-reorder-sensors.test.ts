import { PointerSensor } from '@dnd-kit/core';
import { renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { describe, expect, it } from 'vitest';

import {
  DRAG_HANDLE_ATTRIBUTE,
  useHoaCardSensors,
  useHoaRowSensors,
} from '@/components/apartments/use-hoa-reorder-sensors';

type Activator = {
  eventName: string;
  handler: (event: ReactPointerEvent) => boolean;
};

function rowActivator(): Activator {
  const { result } = renderHook(() => useHoaRowSensors());
  const sensor = result.current[0].sensor as unknown as {
    activators: Activator[];
  };
  return sensor.activators[0];
}

function pointerDown(
  target: Element,
  init: { isPrimary?: boolean; button?: number } = {}
) {
  return {
    nativeEvent: { isPrimary: true, button: 0, ...init, target },
  } as unknown as ReactPointerEvent;
}

function element(html: string) {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild as Element;
}

describe('useHoaRowSensors', () => {
  it('uses a pointer sensor and a keyboard sensor', () => {
    const { result } = renderHook(() => useHoaRowSensors());

    expect(result.current).toHaveLength(2);
  });

  it('starts a drag on pointer down in the row, activated by the pointer', () => {
    const activator = rowActivator();

    expect(activator.eventName).toBe('onPointerDown');
    expect(activator.handler(pointerDown(element('<span>Alfa</span>')))).toBe(
      true
    );
  });

  it('starts a drag from the grip button', () => {
    const grip = element(`<button ${DRAG_HANDLE_ATTRIBUTE}="true"></button>`);

    expect(rowActivator().handler(pointerDown(grip))).toBe(true);
  });

  it('keeps other buttons, links and inputs working', () => {
    const { handler } = rowActivator();

    expect(handler(pointerDown(element('<button></button>')))).toBe(false);
    expect(handler(pointerDown(element('<a href="/x">x</a>')))).toBe(false);
    expect(handler(pointerDown(element('<input />')))).toBe(false);
  });

  it('ignores a click inside a button, such as its icon', () => {
    const button = element('<button><svg></svg></button>');

    expect(
      rowActivator().handler(pointerDown(button.querySelector('svg')!))
    ).toBe(false);
  });

  it('ignores secondary buttons and secondary pointers', () => {
    const { handler } = rowActivator();
    const cell = element('<span></span>');

    expect(handler(pointerDown(cell, { button: 2 }))).toBe(false);
    expect(handler(pointerDown(cell, { isPrimary: false }))).toBe(false);
  });
});

describe('useHoaCardSensors', () => {
  it('uses the default pointer sensor so only the grip starts a drag', () => {
    const { result } = renderHook(() => useHoaCardSensors());

    expect(result.current).toHaveLength(2);
    expect(result.current[0].sensor).toBe(PointerSensor);
    expect(result.current[0].options).toEqual({
      activationConstraint: { distance: 4 },
    });
  });
});
