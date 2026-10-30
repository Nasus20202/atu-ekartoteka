import { Document } from '@react-pdf/renderer';

import type { NotificationItem } from '@/components/dashboard/group-notifications';
import { PdfItemsTable } from '@/components/pdf/items-table';
import {
  DocumentPage,
  PdfHeader,
  PdfNoteText,
} from '@/components/pdf/primitives';
import { registerPdfFonts } from '@/lib/pdf/register-fonts';
import { sumDecimals } from '@/lib/utils/sum';

registerPdfFonts();

export interface NoticePdfApartment {
  address: string;
  hoaName: string | null;
  hoaHeader: string | null;
  hoaFooter: string | null;
  notifications: NotificationItem[];
}

export interface NoticePdfDocumentProps {
  apartments: NoticePdfApartment[];
  generatedDate: string;
}

function NoticePage({
  apartment,
  generatedDate,
}: {
  apartment: NoticePdfApartment;
  generatedDate: string;
}) {
  const total = sumDecimals(apartment.notifications.map((n) => n.totalAmount));
  const subtitle = [apartment.hoaName, `Wygenerowano: ${generatedDate}`]
    .filter(Boolean)
    .join(' | ');

  return (
    <DocumentPage>
      <PdfHeader
        title={`Naliczenia bieżące – ${apartment.address}`}
        subtitle={subtitle}
      />
      {apartment.hoaHeader && <PdfNoteText>{apartment.hoaHeader}</PdfNoteText>}

      <PdfItemsTable items={apartment.notifications} total={total} />

      {apartment.hoaFooter && <PdfNoteText>{apartment.hoaFooter}</PdfNoteText>}
    </DocumentPage>
  );
}

export function NoticePdfDocument({
  apartments,
  generatedDate,
}: NoticePdfDocumentProps) {
  return (
    <Document>
      {apartments.map((apartment) => (
        <NoticePage
          key={apartment.address}
          apartment={apartment}
          generatedDate={generatedDate}
        />
      ))}
    </Document>
  );
}
