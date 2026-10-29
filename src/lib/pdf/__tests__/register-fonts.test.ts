import { describe, expect, it, vi } from 'vitest';

const { mockRegister } = vi.hoisted(() => ({ mockRegister: vi.fn() }));

vi.mock('@react-pdf/renderer', () => ({ Font: { register: mockRegister } }));

import { registerPdfFonts } from '@/lib/pdf/register-fonts';

describe('registerPdfFonts', () => {
  it('registers the Roboto font only once', () => {
    registerPdfFonts();
    registerPdfFonts();

    expect(mockRegister).toHaveBeenCalledOnce();
    expect(mockRegister).toHaveBeenCalledWith({
      family: 'Roboto',
      src: '/fonts/Roboto-Regular.ttf',
    });
  });
});
