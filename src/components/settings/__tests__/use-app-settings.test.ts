import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSettings } from '@/components/settings/use-app-settings';

const actionMock = vi.hoisted(() => ({ updateSettingsAction: vi.fn() }));

vi.mock('@/actions/settings/settings', () => actionMock);

describe('useAppSettings', () => {
  const action = actionMock.updateSettingsAction;

  beforeEach(() => {
    action.mockReset();
  });

  it('starts from the server-provided history window without fetching', () => {
    const { result } = renderHook(() => useAppSettings(3));

    expect(result.current.yearsBack).toBe(3);
    expect(action).not.toHaveBeenCalled();
  });

  it('saves the new history window', async () => {
    const { result } = renderHook(() => useAppSettings(1));

    action.mockResolvedValueOnce({
      ok: true,
      data: { tenantHistoryYearsBack: 5 },
    });
    await act(() => result.current.save(5));

    expect(action).toHaveBeenCalledWith({ tenantHistoryYearsBack: 5 });
    expect(result.current.yearsBack).toBe(5);
    expect(result.current.status).toEqual({ kind: 'saved' });
    expect(result.current.saving).toBe(false);
  });

  it('shows the API error message when saving fails', async () => {
    const { result } = renderHook(() => useAppSettings(1));

    action.mockResolvedValueOnce({
      ok: false,
      error: 'Zła wartość',
      code: 'invalid',
    });
    await act(() => result.current.save(99));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Zła wartość',
    });
    expect(result.current.yearsBack).toBe(1);
  });

  it('falls back to a generic message when the API gives none', async () => {
    const { result } = renderHook(() => useAppSettings(1));

    action.mockResolvedValueOnce({ ok: false, error: '', code: 'failed' });
    await act(() => result.current.save(2));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Nie udało się zapisać ustawień',
    });
  });

  it('shows a generic message when the save request throws', async () => {
    const { result } = renderHook(() => useAppSettings(1));

    action.mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.save(2));

    expect(result.current.status).toEqual({
      kind: 'error',
      message: 'Nie udało się zapisać ustawień',
    });
    expect(result.current.saving).toBe(false);
  });
});
