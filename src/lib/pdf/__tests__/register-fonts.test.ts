import { describe, expect, it, vi } from 'vitest';

const { mockRegister } = vi.hoisted(() => ({ mockRegister: vi.fn() }));

vi.mock('@react-pdf/renderer', () => ({ Font: { register: mockRegister } }));

import { registerPdfFonts } from '@/lib/pdf/register-fonts';

describe('registerPdfFonts', () => {
  it('registers Geist Regular and Bold only once', () => {
    registerPdfFonts();
    registerPdfFonts();

    expect(mockRegister).toHaveBeenCalledOnce();
    expect(mockRegister).toHaveBeenCalledWith({
      family: 'Geist',
      fonts: [
        { src: '/fonts/Geist-Regular.ttf', fontWeight: 400 },
        { src: '/fonts/Geist-Bold.ttf', fontWeight: 700 },
      ],
    });
  });

  it('never registers Roboto', () => {
    registerPdfFonts();

    expect(JSON.stringify(mockRegister.mock.calls)).not.toMatch(/roboto/i);
  });
});
