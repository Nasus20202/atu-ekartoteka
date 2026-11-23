import '@/app/globals.css';

import type { Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ConfirmProvider } from '@/components/providers/confirm-dialog';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TrackingScript } from '@/components/providers/tracking-script';
import { getRootMetadata, THEME_COLOR } from '@/lib/framework/seo';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function generateMetadata() {
  return getRootMetadata();
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TrackingScript />
        <SessionProvider>
          <ThemeProvider attribute="class" enableSystem={true}>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
