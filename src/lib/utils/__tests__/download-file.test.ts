import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadBlob, downloadTextFile } from '@/lib/utils/download-file';

describe('download helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clicks a temporary link and releases the object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe('plik.pdf');
        expect(this.href).toBe('blob:url');
        expect(document.body.contains(this)).toBe(true);
      });

    downloadBlob(new Blob(['x']), 'plik.pdf');

    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');
    expect(document.querySelector('a')).toBeNull();
  });

  it('wraps text content in a plain text blob', () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:text');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadTextFile('treść', 'bledy.txt');

    expect(createObjectURL.mock.calls[0][0].type).toBe('text/plain');
  });
});
