import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

export const alt = 'ATU Ekartoteka';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const LOGO_WIDTH = 270;
const LOGO_HEIGHT = 268;
const TITLE_FONT_SIZE = 210;
const CAPTION_FONT_SIZE = 60;
const BACKGROUND = '#ffffff';
const TITLE_COLOR = '#020817';
const CAPTION_COLOR = '#64748b';

/** Positions of the logo and text blocks, measured on the 1200x630 canvas. */
const LAYOUT = {
  logo: { left: 221, top: 184 },
  title: { left: 578, top: 155 },
  caption: { left: 626, top: 393 },
};

const [geistRegular, geistBold, logo] = await Promise.all([
  readFile(join(process.cwd(), 'public/fonts/Geist-Regular.ttf')),
  readFile(join(process.cwd(), 'public/fonts/Geist-Bold.ttf')),
  readFile(join(process.cwd(), 'src/app/favicon.ico')),
]);

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        background: BACKGROUND,
      }}
    >
      <img
        src={`data:image/x-icon;base64,${logo.toString('base64')}`}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        style={{ position: 'absolute', ...LAYOUT.logo }}
      />
      <div
        style={{
          position: 'absolute',
          ...LAYOUT.title,
          display: 'flex',
          fontFamily: 'Geist',
          fontWeight: 700,
          fontSize: TITLE_FONT_SIZE,
          lineHeight: 1,
          color: TITLE_COLOR,
        }}
      >
        ATU
      </div>
      <div
        style={{
          position: 'absolute',
          ...LAYOUT.caption,
          display: 'flex',
          fontFamily: 'Geist',
          fontWeight: 400,
          fontSize: CAPTION_FONT_SIZE,
          lineHeight: 1,
          color: CAPTION_COLOR,
        }}
      >
        Ekartoteka
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Geist', data: geistRegular, weight: 400, style: 'normal' },
        { name: 'Geist', data: geistBold, weight: 700, style: 'normal' },
      ],
    }
  );
}
