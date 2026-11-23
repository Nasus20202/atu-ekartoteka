import type { Metadata } from 'next';

import { PUBLIC_PAGES, publicPageMetadata } from '@/lib/framework/seo';

export const metadata: Metadata = publicPageMetadata(
  PUBLIC_PAGES.forgotPassword
);

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
