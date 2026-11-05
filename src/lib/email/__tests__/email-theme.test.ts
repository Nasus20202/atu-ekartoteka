import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { EMAIL_RADIUS, emailColors } from '@/lib/email/email-theme';

const PX_PER_REM = 16;
const HEX_RADIX = 16;
const HEX_DIGITS = 2;
const PERCENT = 100;
const HUE_SEGMENTS = 12;
const SEGMENT_DEGREES = 30;
const MAX_CHANNEL = 255;

const globals = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', 'globals.css'),
  'utf-8'
);
const rootBlock = globals.slice(globals.indexOf(':root'));

function token(name: string): string {
  const match = rootBlock.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing design token --${name}`);
  return match[1].trim();
}

function hslToHex(value: string): string {
  const [h, s, l] = value.split(/\s+/).map((part) => Number.parseFloat(part));
  const sat = s / PERCENT;
  const light = l / PERCENT;
  const amplitude = sat * Math.min(light, 1 - light);
  const channel = (offset: number) => {
    const k = (offset + h / SEGMENT_DEGREES) % HUE_SEGMENTS;
    const component =
      light - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(component * MAX_CHANNEL)
      .toString(HEX_RADIX)
      .padStart(HEX_DIGITS, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

describe('email theme', () => {
  it.each([
    ['primary', 'primary'],
    ['primaryForeground', 'primary-foreground'],
    ['muted', 'muted'],
    ['mutedForeground', 'muted-foreground'],
    ['border', 'border'],
  ] as const)('mirrors the website %s token', (key, cssName) => {
    expect(emailColors[key]).toBe(hslToHex(token(cssName)));
  });

  it('uses the website corner radius', () => {
    expect(EMAIL_RADIUS).toBe(
      `${Number.parseFloat(token('radius')) * PX_PER_REM}px`
    );
  });
});
