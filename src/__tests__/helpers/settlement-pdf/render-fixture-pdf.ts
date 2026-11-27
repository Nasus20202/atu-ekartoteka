import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Document, Font, Page, pdf, Text } from '@react-pdf/renderer';
import { createElement } from 'react';

import {
  FIXTURE_LEFT,
  type FixturePage,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';

const FONT_FAMILY = 'FixtureGeist';
const FONT_SIZE = 9;
const FIRST_ROW_TOP = 20;
const ROW_HEIGHT = 14;

let registered = false;

// A data URL loads in both the Node and the browser build of the renderer
function registerFont() {
  if (registered) return;
  registered = true;
  const file = path.join(process.cwd(), 'public/fonts/Geist-Regular.ttf');
  const data = readFileSync(file).toString('base64');
  Font.register({ family: FONT_FAMILY, src: `data:font/ttf;base64,${data}` });
}

/** A PDF that prints the rows at fixed positions, like the legacy reports. */
export async function renderFixturePdf(pages: FixturePage[]): Promise<Buffer> {
  registerFont();
  const document = createElement(
    Document,
    null,
    pages.map((page, pageIndex) =>
      createElement(
        Page,
        { key: pageIndex, size: 'A4', style: { fontFamily: FONT_FAMILY } },
        page.map(({ text, x = FIXTURE_LEFT, size = FONT_SIZE }, index) =>
          createElement(
            Text,
            {
              key: index,
              style: {
                position: 'absolute',
                left: x,
                top: FIRST_ROW_TOP + index * ROW_HEIGHT,
                fontSize: size,
              },
            },
            text
          )
        )
      )
    )
  );
  const blob = await pdf(document).toBlob();
  return Buffer.from(await blob.arrayBuffer());
}
