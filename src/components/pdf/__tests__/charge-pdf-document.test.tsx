import { describe, expect, it, vi } from 'vitest';

import type { ChargePdfDocumentProps } from '@/components/pdf/charge-pdf-document';

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

const SAMPLE_PROPS: ChargePdfDocumentProps = {
  apartmentLabel: 'ul. Testowa 1/2',
  hoaName: 'Wspólnota Mieszkaniowa Testowa',
  generatedDate: '2024-01-15',
  periodGroups: [
    {
      period: '202401',
      periodLabel: 'Styczeń 2024',
      charges: [
        {
          id: 'c1',
          description: 'Czynsz',
          quantity: 1,
          unit: 'szt.',
          unitPrice: 500,
          totalAmount: 500,
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
        },
        {
          id: 'c2',
          description: 'Fundusz remontowy',
          quantity: 50,
          unit: 'm²',
          unitPrice: 1.5,
          totalAmount: 75,
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
        },
      ],
      total: 575,
    },
  ],
};

describe('ChargePdfDocument', () => {
  it('renders without errors with valid props', async () => {
    const { ChargePdfDocument } =
      await import('@/components/pdf/charge-pdf-document');
    expect(() => ChargePdfDocument(SAMPLE_PROPS)).not.toThrow();
  });

  it('renders without errors with empty period groups', async () => {
    const { ChargePdfDocument } =
      await import('@/components/pdf/charge-pdf-document');
    const props: ChargePdfDocumentProps = { ...SAMPLE_PROPS, periodGroups: [] };
    expect(() => ChargePdfDocument(props)).not.toThrow();
  });

  it('renders without errors with multiple period groups', async () => {
    const { ChargePdfDocument } =
      await import('@/components/pdf/charge-pdf-document');
    const props: ChargePdfDocumentProps = {
      ...SAMPLE_PROPS,
      periodGroups: [
        ...SAMPLE_PROPS.periodGroups,
        {
          period: '202402',
          periodLabel: 'Luty 2024',
          charges: [
            {
              id: 'c3',
              description: 'Ogrzewanie',
              quantity: 1,
              unit: 'szt.',
              unitPrice: 200,
              totalAmount: 200,
              dateFrom: new Date('2024-02-01'),
              dateTo: new Date('2024-02-29'),
            },
          ],
          total: 200,
        },
      ],
    };
    expect(() => ChargePdfDocument(props)).not.toThrow();
  });

  it('includes Polish characters in props without errors', async () => {
    const { ChargePdfDocument } =
      await import('@/components/pdf/charge-pdf-document');
    const props: ChargePdfDocumentProps = {
      ...SAMPLE_PROPS,
      hoaName: 'Wspólnota Mieszkaniowa Śródmieście',
      periodGroups: [
        {
          period: '202401',
          periodLabel: 'Styczeń 2024',
          charges: [
            {
              id: 'c1',
              description: 'Czynsz za lokal mieszkalny',
              quantity: 1,
              unit: 'szt.',
              unitPrice: 600,
              totalAmount: 600,
              dateFrom: new Date('2024-01-01'),
              dateTo: new Date('2024-01-31'),
            },
          ],
          total: 600,
        },
      ],
    };
    expect(() => ChargePdfDocument(props)).not.toThrow();
  });
});
