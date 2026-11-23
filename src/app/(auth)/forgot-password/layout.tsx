import { PUBLIC_PAGES, publicPageMetadata } from '@/lib/framework/seo';

export const metadata = publicPageMetadata(PUBLIC_PAGES.forgotPassword);

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
