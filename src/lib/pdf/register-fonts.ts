import { Font } from '@react-pdf/renderer';

import { PDF_FONT_FAMILY, PDF_FONT_FILES } from '@/lib/pdf/font-constants';

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: PDF_FONT_FILES.regular, fontWeight: 400 },
      { src: PDF_FONT_FILES.bold, fontWeight: 700 },
    ],
  });
}
