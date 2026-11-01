import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DownloadChargesPdfButton } from '@/components/pdf/download-charges-pdf-button';
import {
  DownloadNoticePdfButton,
  toNoticePdfApartments,
} from '@/components/pdf/download-notice-pdf-button';
import { DownloadPaymentPdfButton } from '@/components/pdf/download-payment-pdf-button';
import type { PdfDownloadButtonProps } from '@/components/pdf/pdf-download-button';
import {
  PAYMENT_AMOUNT_FIELD_KEYS,
  type PaymentPdfDto,
} from '@/lib/types/dto/payment-dto';

const PDF_BLOB = new Blob(['pdf']);

const mocks = vi.hoisted(() => ({
  buttonProps: null as PdfDownloadButtonProps | null,
  pdf: vi.fn(),
}));

vi.mock('@/components/pdf/pdf-download-button', () => ({
  PdfDownloadButton: (props: PdfDownloadButtonProps) => {
    mocks.buttonProps = props;
    return null;
  },
}));

vi.mock('@react-pdf/renderer', () => ({ pdf: mocks.pdf }));

vi.mock('@/components/pdf/charge-pdf-document', () => ({
  ChargePdfDocument: () => null,
}));

vi.mock('@/components/pdf/payment-pdf-document', () => ({
  PaymentPdfDocument: () => null,
}));

vi.mock('@/components/pdf/notice-pdf-document', () => ({
  NoticePdfDocument: () => null,
}));

function renderedDocumentProps() {
  const [element] = mocks.pdf.mock.calls[0] as [ReactElement];
  return element.props as Record<string, unknown>;
}

function makePayment(): PaymentPdfDto {
  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: '2024-01-01T00:00:00.000Z',
    dateTo: '2024-12-31T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...Object.fromEntries(PAYMENT_AMOUNT_FIELD_KEYS.map((key) => [key, '0'])),
    calculatedClosingBalance: '-12.5',
  } as PaymentPdfDto;
}

describe('PDF download buttons', () => {
  beforeEach(() => {
    mocks.buttonProps = null;
    mocks.pdf.mockReset();
    mocks.pdf.mockReturnValue({ toBlob: () => Promise.resolve(PDF_BLOB) });
  });

  it('creates a charges PDF for the period with a descriptive label', async () => {
    render(
      <DownloadChargesPdfButton
        apartmentLabel="A-1"
        hoaName="Wspólnota"
        period="202411"
        charges={[
          {
            id: 'c1',
            description: 'Czynsz',
            quantity: '1',
            unit: 'szt',
            unitPrice: '100',
            totalAmount: '100',
          },
          {
            id: 'c2',
            description: 'Woda',
            quantity: '2',
            unit: 'm3',
            unitPrice: '12.5',
            totalAmount: '25',
          },
        ]}
        compact
      />
    );

    expect(mocks.buttonProps?.label).toBe(
      'Pobierz PDF naliczeń: Listopad 2024'
    );
    expect(mocks.buttonProps?.compact).toBe(true);

    const file = await mocks.buttonProps!.createPdf();

    expect(file).toEqual({
      blob: PDF_BLOB,
      fileName: 'naliczenia-A-1-202411.pdf',
    });
    const [group] = renderedDocumentProps().periodGroups as {
      periodLabel: string;
      total: { toString(): string };
      charges: unknown[];
    }[];
    expect(group.periodLabel).toBe('Listopad 2024');
    expect(group.total.toString()).toBe('125');
    expect(group.charges).toHaveLength(2);
  });

  it('creates a payments PDF for the year with hydrated amounts', async () => {
    render(
      <DownloadPaymentPdfButton
        apartmentLabel="A-1"
        hoaName="Wspólnota"
        payment={makePayment()}
      />
    );

    expect(mocks.buttonProps?.label).toBe('Pobierz PDF wpłat: rok 2024');
    expect(mocks.buttonProps?.compact).toBeUndefined();

    const file = await mocks.buttonProps!.createPdf();

    expect(file).toEqual({ blob: PDF_BLOB, fileName: 'wplaty-A-1-2024.pdf' });
    const payment = renderedDocumentProps().payment as {
      calculatedClosingBalance: { toNumber(): number };
      dateFrom: Date;
    };
    expect(payment.calculatedClosingBalance.toNumber()).toBe(-12.5);
    expect(payment.dateFrom).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });

  it('creates a notice PDF with one apartment section per address', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T12:00:00Z'));
    const notifications = [
      {
        id: 'n1',
        description: 'Zaliczka CO',
        quantity: '1',
        unit: 'szt',
        unitPrice: '100',
        totalAmount: '100',
        apartmentNumber: '1',
        apartmentAddress: 'ul. A 1/1',
        hoaName: 'Wspólnota A',
        hoaHeader: 'Nagłówek A',
        hoaFooter: 'Stopka A',
      },
      {
        id: 'n2',
        description: 'Woda',
        quantity: '1',
        unit: 'm3',
        unitPrice: '20',
        totalAmount: '20',
        apartmentNumber: '2',
        apartmentAddress: 'ul. B 2/2',
      },
    ];

    render(<DownloadNoticePdfButton notifications={notifications} />);
    const file = await mocks.buttonProps!.createPdf();

    expect(file).toEqual({
      blob: PDF_BLOB,
      fileName: 'naliczenia-biezace-2026-10-30.pdf',
    });
    expect(renderedDocumentProps()).toMatchObject({
      generatedDate: '2026-10-30',
    });
    expect(toNoticePdfApartments(notifications)).toEqual([
      {
        address: 'ul. A 1/1',
        hoaName: 'Wspólnota A',
        hoaHeader: 'Nagłówek A',
        hoaFooter: 'Stopka A',
        notifications: [notifications[0]],
      },
      {
        address: 'ul. B 2/2',
        hoaName: null,
        hoaHeader: null,
        hoaFooter: null,
        notifications: [notifications[1]],
      },
    ]);
    vi.useRealTimers();
  });
});
