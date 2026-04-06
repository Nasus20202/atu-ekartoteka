import '@/app/globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ConfirmProvider } from '@/components/confirm-dialog';
import { SessionProvider } from '@/components/session-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { TrackingScript } from '@/components/tracking-script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ATU Ekartoteka',
  description: 'System zarządzania mieszkaniami ATU',
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
