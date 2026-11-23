import { PUBLIC_PAGES, publicPageMetadata } from '@/lib/framework/seo';

export const metadata = publicPageMetadata(PUBLIC_PAGES.login);

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
