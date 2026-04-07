import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHoaSelection } from '@/app/admin/users/management/use-hoa-selection';

function makeHoa(id: string, apartmentIds: string[]) {
  return {
    hoaId: id,
    hoaName: id,
    apartments: apartmentIds.map((aid) => ({
      id: aid,
      number: aid,
      building: null,
      owner: null,
      email: `${aid}@test.com`,
      isActive: true,
      hasTwinWithTenant: false,
    })),
  };
}

describe('useHoaSelection', () => {
  it('starts with no selections', () => {
    const { result } = renderHook(() =>
      useHoaSelection([makeHoa('hoa1', ['apt1', 'apt2'])])
    );
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('returns allIds combining all apartments from all HOAs', () => {
    const { result } = renderHook(() =>
      useHoaSelection([
        makeHoa('hoa1', ['apt1', 'apt2']),
        makeHoa('hoa2', ['apt3']),
      ])
    );
    expect(result.current.allIds).toEqual(['apt1', 'apt2', 'apt3']);
  });

  it('handles null/undefined hoas gracefully', () => {
    const { result } = renderHook(() =>
      useHoaSelection(null as unknown as never[])
    );
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.allIds).toHaveLength(0);
  });

  describe('toggleApartment', () => {
    it('selects an apartment when not selected', () => {
      const { result } = renderHook(() =>
        useHoaSelection([makeHoa('hoa1', ['apt1', 'apt2'])])
      );
      act(() => result.current.toggleApartment('apt1'));
      expect(result.current.selectedIds.has('apt1')).toBe(true);
      expect(result.current.selectedIds.has('apt2')).toBe(false);
    });

    it('deselects an apartment when already selected', () => {
      const { result } = renderHook(() =>
        useHoaSelection([makeHoa('hoa1', ['apt1', 'apt2'])])
      );
      act(() => result.current.toggleApartment('apt1'));
      act(() => result.current.toggleApartment('apt1'));
      expect(result.current.selectedIds.has('apt1')).toBe(false);
    });
  });

  describe('toggleHoa', () => {
    it('selects all apartments in a HOA when none selected', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      act(() => result.current.toggleHoa(hoa));
      expect(result.current.selectedIds.has('apt1')).toBe(true);
      expect(result.current.selectedIds.has('apt2')).toBe(true);
    });

    it('deselects all apartments in a HOA when all are selected', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      act(() => result.current.toggleHoa(hoa)); // select all
      act(() => result.current.toggleHoa(hoa)); // deselect all
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('selects all when only some apartments are selected (indeterminate state)', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      act(() => result.current.toggleApartment('apt1')); // select one
      act(() => result.current.toggleHoa(hoa)); // should select all
      expect(result.current.selectedIds.has('apt1')).toBe(true);
      expect(result.current.selectedIds.has('apt2')).toBe(true);
    });
  });

  describe('isHoaSelected / isHoaIndeterminate', () => {
    it('isHoaSelected returns true when all apartments in HOA are selected', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      act(() => result.current.toggleHoa(hoa));
      expect(result.current.isHoaSelected(hoa)).toBe(true);
    });

    it('isHoaSelected returns false when only some apartments selected', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      act(() => result.current.toggleApartment('apt1'));
      expect(result.current.isHoaSelected(hoa)).toBe(false);
    });

    it('isHoaIndeterminate returns true when some but not all are selected', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      act(() => result.current.toggleApartment('apt1'));
      expect(result.current.isHoaIndeterminate(hoa)).toBe(true);
    });

    it('isHoaIndeterminate returns false when none selected', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      expect(result.current.isHoaIndeterminate(hoa)).toBe(false);
    });

    it('isHoaIndeterminate returns false when all selected', () => {
      const hoa = makeHoa('hoa1', ['apt1', 'apt2']);
      const { result } = renderHook(() => useHoaSelection([hoa]));
      act(() => result.current.toggleHoa(hoa));
      expect(result.current.isHoaIndeterminate(hoa)).toBe(false);
    });
  });

  describe('selectIds', () => {
    it('adds ids to selection when checked is true', () => {
      const { result } = renderHook(() =>
        useHoaSelection([makeHoa('hoa1', ['apt1', 'apt2', 'apt3'])])
      );
      act(() => result.current.selectIds(['apt1', 'apt2'], true));
      expect(result.current.selectedIds.has('apt1')).toBe(true);
      expect(result.current.selectedIds.has('apt2')).toBe(true);
      expect(result.current.selectedIds.has('apt3')).toBe(false);
    });

    it('removes ids from selection when checked is false', () => {
      const { result } = renderHook(() =>
        useHoaSelection([makeHoa('hoa1', ['apt1', 'apt2', 'apt3'])])
      );
      act(() => result.current.selectIds(['apt1', 'apt2', 'apt3'], true));
      act(() => result.current.selectIds(['apt1', 'apt3'], false));
      expect(result.current.selectedIds.has('apt1')).toBe(false);
      expect(result.current.selectedIds.has('apt2')).toBe(true);
      expect(result.current.selectedIds.has('apt3')).toBe(false);
    });

    it('preserves previously selected ids when adding new ones', () => {
      const { result } = renderHook(() =>
        useHoaSelection([makeHoa('hoa1', ['apt1', 'apt2', 'apt3'])])
      );
      act(() => result.current.toggleApartment('apt1'));
      act(() => result.current.selectIds(['apt2'], true));
      expect(result.current.selectedIds.has('apt1')).toBe(true);
      expect(result.current.selectedIds.has('apt2')).toBe(true);
    });
  });
});
