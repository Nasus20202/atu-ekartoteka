import { describe, expect, it, vi } from 'vitest';

import type { PaymentPdfDocumentProps } from '@/components/pdf/payment-pdf-document';
import { Prisma } from '@/generated/prisma/browser';
import type { Payment } from '@/lib/types';
import type { PaymentDtoSource } from '@/lib/types/dto/payment-dto';

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (styles: unknown) => styles },
  Font: { register: vi.fn() },
  pdf: vi.fn(() => ({ toBlob: vi.fn().mockResolvedValue(new Blob()) })),
}));

vi.mock('@/lib/pdf/register-fonts', () => ({ registerPdfFonts: vi.fn() }));

function makePayment(overrides: Partial<PaymentDtoSource> = {}): Payment {
  return {
    id: 'pay-1',
    apartmentId: 'apt-1',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingBalance: new Prisma.Decimal(0),
    closingBalance: new Prisma.Decimal(-100),
    openingDebt: new Prisma.Decimal(0),
    openingSurplus: new Prisma.Decimal(0),
    januaryPayments: new Prisma.Decimal(500),
    februaryPayments: new Prisma.Decimal(500),
    marchPayments: new Prisma.Decimal(500),
    aprilPayments: new Prisma.Decimal(500),
    mayPayments: new Prisma.Decimal(500),
    junePayments: new Prisma.Decimal(500),
    julyPayments: new Prisma.Decimal(500),
    augustPayments: new Prisma.Decimal(500),
    septemberPayments: new Prisma.Decimal(500),
    octoberPayments: new Prisma.Decimal(500),
    novemberPayments: new Prisma.Decimal(500),
    decemberPayments: new Prisma.Decimal(500),
    januaryCharges: new Prisma.Decimal(600),
    februaryCharges: new Prisma.Decimal(600),
    marchCharges: new Prisma.Decimal(600),
    aprilCharges: new Prisma.Decimal(600),
    mayCharges: new Prisma.Decimal(600),
    juneCharges: new Prisma.Decimal(600),
    julyCharges: new Prisma.Decimal(600),
    augustCharges: new Prisma.Decimal(600),
    septemberCharges: new Prisma.Decimal(600),
    octoberCharges: new Prisma.Decimal(600),
    novemberCharges: new Prisma.Decimal(600),
    decemberCharges: new Prisma.Decimal(600),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as Payment;
}

const SAMPLE_PROPS: PaymentPdfDocumentProps = {
  apartmentLabel: 'ul. Testowa 1/2',
  hoaName: 'Wspólnota Mieszkaniowa Testowa',
  generatedDate: '2024-12-31',
  payment: makePayment(),
};

describe('PaymentPdfDocument', () => {
  it('renders without errors with valid props', async () => {
    const { PaymentPdfDocument } =
      await import('@/components/pdf/payment-pdf-document');
    expect(() => PaymentPdfDocument(SAMPLE_PROPS)).not.toThrow();
  });

  it('renders without errors when closing balance is positive', async () => {
    const { PaymentPdfDocument } =
      await import('@/components/pdf/payment-pdf-document');
    const props: PaymentPdfDocumentProps = {
      ...SAMPLE_PROPS,
      payment: makePayment({
        openingBalance: new Prisma.Decimal(100),
        closingBalance: new Prisma.Decimal(500),
      }),
    };
    expect(() => PaymentPdfDocument(props)).not.toThrow();
  });

  it('renders without errors when all monthly values are zero', async () => {
    const { PaymentPdfDocument } =
      await import('@/components/pdf/payment-pdf-document');
    const props: PaymentPdfDocumentProps = {
      ...SAMPLE_PROPS,
      payment: makePayment({
        openingBalance: 0,
        closingBalance: 0,
        januaryPayments: 0,
        februaryPayments: 0,
        marchPayments: 0,
        aprilPayments: 0,
        mayPayments: 0,
        junePayments: 0,
        julyPayments: 0,
        augustPayments: 0,
        septemberPayments: 0,
        octoberPayments: 0,
        novemberPayments: 0,
        decemberPayments: 0,
        januaryCharges: 0,
        februaryCharges: 0,
        marchCharges: 0,
        aprilCharges: 0,
        mayCharges: 0,
        juneCharges: 0,
        julyCharges: 0,
        augustCharges: 0,
        septemberCharges: 0,
        octoberCharges: 0,
        novemberCharges: 0,
        decemberCharges: 0,
      }),
    };
    expect(() => PaymentPdfDocument(props)).not.toThrow();
  });

  it('includes Polish characters in props without errors', async () => {
    const { PaymentPdfDocument } =
      await import('@/components/pdf/payment-pdf-document');
    const props: PaymentPdfDocumentProps = {
      ...SAMPLE_PROPS,
      hoaName: 'Wspólnota Śródmiejska',
      apartmentLabel: 'ul. Żółkiewskiego 5/3',
    };
    expect(() => PaymentPdfDocument(props)).not.toThrow();
  });
});
