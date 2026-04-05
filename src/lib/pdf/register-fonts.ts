import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Roboto',
    src: '/fonts/Roboto-Regular.ttf',
  });
}
