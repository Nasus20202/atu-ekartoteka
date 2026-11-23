import type { CSSProperties } from 'react';

// Hex mirrors of the website design tokens in src/app/globals.css (email
// clients do not reliably support hsl()). email-theme.test.ts keeps them in sync.
export const emailColors = {
  primary: '#2563eb',
  primaryForeground: '#f8fafc',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  card: '#ffffff',
  foreground: '#020817',
  subtle: '#94a3b8',
} as const;

export const EMAIL_RADIUS = '8px';
export const EMAIL_BUTTON_RADIUS = '6px';
export const EMAIL_CARD_RADIUS = '12px';

const APP_SHADOW =
  '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
const CARD_PADDING = '32px';

const fonts = {
  sans: "Geist, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'Geist Mono', 'SFMono-Regular', Consolas, Menlo, monospace",
} as const;

const copy: CSSProperties = {
  margin: '0 0 16px 0',
  color: emailColors.foreground,
  fontSize: '15px',
  lineHeight: 1.6,
};

const note: CSSProperties = {
  margin: '0 0 8px 0',
  color: emailColors.mutedForeground,
  fontSize: '13px',
  lineHeight: 1.5,
};

export const emailStyles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: emailColors.muted,
    fontFamily: fonts.sans,
  },
  outer: { padding: `${CARD_PADDING} 16px` },
  card: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: emailColors.card,
    border: `1px solid ${emailColors.border}`,
    borderRadius: EMAIL_CARD_RADIUS,
    boxShadow: APP_SHADOW,
  },
  header: {
    padding: '20px 32px',
    borderBottom: `1px solid ${emailColors.border}`,
    fontSize: '16px',
    fontWeight: 700,
    color: emailColors.primary,
  },
  content: { padding: CARD_PADDING },
  heading: {
    margin: '0 0 20px 0',
    color: emailColors.foreground,
    fontSize: '22px',
    lineHeight: 1.3,
    fontWeight: 600,
  },
  copy,
  note,
  fallback: { ...note, margin: '0 0 20px 0', lineHeight: 1.5 },
  fallbackLink: {
    color: emailColors.primary,
    textDecoration: 'underline',
    wordBreak: 'break-all',
  },
  button: {
    display: 'inline-block',
    padding: '10px 16px',
    color: emailColors.primaryForeground,
    backgroundColor: emailColors.primary,
    borderRadius: EMAIL_BUTTON_RADIUS,
    boxShadow: APP_SHADOW,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  },
  buttonWrap: { margin: '8px 0 20px 0' },
  details: {
    margin: '0 0 20px 0',
    backgroundColor: emailColors.muted,
    border: `1px solid ${emailColors.border}`,
    borderRadius: EMAIL_RADIUS,
    padding: '16px 20px',
  },
  detailLabel: {
    display: 'block',
    marginBottom: '4px',
    color: emailColors.mutedForeground,
    fontSize: '13px',
  },
  mono: { fontFamily: fonts.mono },
  footer: {
    margin: '16px 0 0 0',
    color: emailColors.subtle,
    fontSize: '12px',
    lineHeight: 'normal',
    textAlign: 'center',
  },
  footerLink: {
    color: emailColors.mutedForeground,
    textDecoration: 'underline',
  },
} satisfies Record<string, CSSProperties>;
