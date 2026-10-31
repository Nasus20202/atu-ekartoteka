'use client';

import {
  groupByApartment,
  type NotificationItem,
} from '@/components/dashboard/group-notifications';
import type { NoticePdfApartment } from '@/components/pdf/notice-pdf-document';
import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';
import { toLocalIsoDate } from '@/lib/utils/local-date';

interface DownloadNoticePdfButtonProps {
  notifications: NotificationItem[];
}

export function toNoticePdfApartments(
  notifications: NotificationItem[]
): NoticePdfApartment[] {
  return groupByApartment(notifications).map(({ address, notifications }) => {
    const [first] = notifications;
    return {
      address,
      hoaName: first.hoaName ?? null,
      hoaHeader: first.hoaHeader ?? null,
      hoaFooter: first.hoaFooter ?? null,
      notifications,
    };
  });
}

export function DownloadNoticePdfButton({
  notifications,
}: DownloadNoticePdfButtonProps) {
  const createPdf = async () => {
    const { pdf } = await import('@react-pdf/renderer');
    const { NoticePdfDocument } =
      await import('@/components/pdf/notice-pdf-document');

    const generatedDate = toLocalIsoDate(new Date());
    const blob = await pdf(
      <NoticePdfDocument
        apartments={toNoticePdfApartments(notifications)}
        generatedDate={generatedDate}
      />
    ).toBlob();

    return { blob, fileName: `naliczenia-biezace-${generatedDate}.pdf` };
  };

  return (
    <PdfDownloadButton
      label="Pobierz PDF bieżących naliczeń"
      compact
      createPdf={createPdf}
    />
  );
}
