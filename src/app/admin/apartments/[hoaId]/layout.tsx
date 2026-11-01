import type { Metadata } from 'next';

import { nestedTitle } from '@/lib/metadata/document-title';
import { getHoaApartmentsTitle } from '@/lib/metadata/page-titles';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hoaId: string }>;
}): Promise<Metadata> {
  const { hoaId } = await params;
  return { title: nestedTitle(await getHoaApartmentsTitle(hoaId)) };
}

export default function HoaApartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
