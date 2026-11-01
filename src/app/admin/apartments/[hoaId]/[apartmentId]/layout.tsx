import type { Metadata } from 'next';

import { getApartmentTitle } from '@/lib/metadata/page-titles';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ apartmentId: string }>;
}): Promise<Metadata> {
  const { apartmentId } = await params;
  return { title: await getApartmentTitle(apartmentId) };
}

export default function ApartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
