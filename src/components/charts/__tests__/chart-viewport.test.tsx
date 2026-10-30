import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CHART_VIEWPORT_SIZE,
  useChartViewport,
} from '@/components/charts/chart-viewport';

const makeData = (length: number) =>
  Array.from({ length }, (_, index) => ({ label: `M${index + 1}` }));

describe('useChartViewport', () => {
  it('shows all data without navigation when it fits the viewport', () => {
    const { result } = renderHook(() => useChartViewport(makeData(3)));

    expect(result.current.visibleData).toHaveLength(3);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
  });

  it('starts at the newest months', () => {
    const { result } = renderHook(() =>
      useChartViewport(makeData(CHART_VIEWPORT_SIZE + 2))
    );

    expect(result.current.visibleData).toHaveLength(CHART_VIEWPORT_SIZE);
    expect(result.current.visibleData[0].label).toBe('M3');
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it('moves back and forward within the data bounds', () => {
    const { result } = renderHook(() =>
      useChartViewport(makeData(CHART_VIEWPORT_SIZE + 1))
    );

    act(() => result.current.goBack());
    act(() => result.current.goBack());
    expect(result.current.visibleData[0].label).toBe('M1');
    expect(result.current.canGoBack).toBe(false);

    act(() => result.current.goForward());
    act(() => result.current.goForward());
    expect(result.current.visibleData[0].label).toBe('M2');
    expect(result.current.canGoForward).toBe(false);
  });
});
