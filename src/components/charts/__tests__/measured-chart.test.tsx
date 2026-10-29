import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeasuredChart } from '@/components/charts/measured-chart';

describe('MeasuredChart', () => {
  let resize: () => void;
  let size: { width: number; height: number };
  const disconnect = vi.fn();

  beforeEach(() => {
    size = { width: 400, height: 200 };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => size as DOMRect
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect = disconnect;
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderChart = () =>
    render(
      <MeasuredChart data-testid="chart">
        {({ width, height }) => <span>{`${width}x${height}`}</span>}
      </MeasuredChart>
    );

  it('renders children with the measured size and follows resizes', () => {
    renderChart();
    expect(screen.getByText('400x200')).toBeInTheDocument();

    size = { width: 300, height: 150 };
    act(() => resize());

    expect(screen.getByText('300x150')).toBeInTheDocument();
  });

  it('keeps the size when a resize does not change it', () => {
    renderChart();

    act(() => resize());

    expect(screen.getByText('400x200')).toBeInTheDocument();
  });

  it('renders nothing until the container has a size', () => {
    size = { width: 0, height: 0 };

    renderChart();

    expect(screen.getByTestId('chart')).toBeEmptyDOMElement();
  });

  it('stops observing on unmount', () => {
    const { unmount } = renderChart();

    unmount();

    expect(disconnect).toHaveBeenCalled();
  });
});
