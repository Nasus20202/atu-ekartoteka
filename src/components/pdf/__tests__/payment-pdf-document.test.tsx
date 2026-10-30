import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createMockPayment } from '@/__tests__/fixtures';
import type { PaymentPdfDocumentProps } from '@/components/pdf/payment-pdf-document';
import { Prisma } from '@/generated/prisma/browser';
import type { Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  CHARGE_MONTH_FIELD_KEYS,
  PAYMENT_MONTH_FIELD_KEYS,
} from '@/lib/utils/payment-months';

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

const MONTHLY_PAYMENT = 500;
const MONTHLY_CHARGE = 600;

function monthlyAmounts(payment: number, charge: number): Partial<Payment> {
  return Object.fromEntries([
    ...PAYMENT_MONTH_FIELD_KEYS.map((key) => [
      key,
      new Prisma.Decimal(payment),
    ]),
    ...CHARGE_MONTH_FIELD_KEYS.map((key) => [key, new Prisma.Decimal(charge)]),
  ]);
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return createMockPayment({
    ...monthlyAmounts(MONTHLY_PAYMENT, MONTHLY_CHARGE),
    closingBalance: new Prisma.Decimal(-100),
    ...overrides,
  });
}

const SAMPLE_PROPS: PaymentPdfDocumentProps = {
  apartmentLabel: 'ul. Testowa 1/2',
  hoaName: 'Wspólnota Mieszkaniowa Testowa',
  generatedDate: '2024-12-31',
  payment: makePayment(),
};

async function renderText(props: PaymentPdfDocumentProps) {
  const { PaymentPdfDocument } =
    await import('@/components/pdf/payment-pdf-document');
  return render(<PaymentPdfDocument {...props} />).container.textContent;
}

describe('PaymentPdfDocument', () => {
  it('renders the title, summary and monthly rows', async () => {
    const text = await renderText(SAMPLE_PROPS);

    expect(text).toContain('Wpłaty 2024 - ul. Testowa 1/2');
    expect(text).toContain(
      'Wspólnota Mieszkaniowa Testowa | Wygenerowano: 2024-12-31'
    );
    expect(text).toContain('Podsumowanie roku 2024');
    expect(text).toContain(formatCurrency(MONTHLY_PAYMENT * 12));
    expect(text).toContain(formatCurrency(MONTHLY_CHARGE * 12));
    expect(text).toContain(formatCurrency(-100));
  });

  it('renders a positive closing balance', async () => {
    const text = await renderText({
      ...SAMPLE_PROPS,
      payment: makePayment({
        openingBalance: new Prisma.Decimal(100),
        closingBalance: new Prisma.Decimal(500),
      }),
    });

    expect(text).toContain(formatCurrency(100));
    expect(text).toContain(formatCurrency(500));
  });

  it('renders a negative opening balance', async () => {
    const text = await renderText({
      ...SAMPLE_PROPS,
      payment: makePayment({ openingBalance: new Prisma.Decimal(-250) }),
    });

    expect(text).toContain(formatCurrency(-250));
  });

  it('renders zero totals when every month is empty', async () => {
    const text = await renderText({
      ...SAMPLE_PROPS,
      payment: createMockPayment(),
    });

    expect(text).toContain('Saldo końcowe');
    expect(text).toContain(formatCurrency(0));
    expect(text).not.toContain(formatCurrency(MONTHLY_PAYMENT));
  });

  it('adds the opening values to Razem but not to the summary tiles', async () => {
    const text = await renderText({
      ...SAMPLE_PROPS,
      payment: makePayment({
        openingSurplus: new Prisma.Decimal(100),
        openingDebt: new Prisma.Decimal(30),
      }),
    });
    const [summary, razem] = text?.split('Razem') ?? [];

    expect(summary).toContain(formatCurrency(MONTHLY_PAYMENT * 12));
    expect(summary).toContain(formatCurrency(MONTHLY_CHARGE * 12));
    expect(razem).toContain(formatCurrency(MONTHLY_PAYMENT * 12 + 100));
    expect(razem).toContain(formatCurrency(MONTHLY_CHARGE * 12 + 30));
    expect(razem).not.toContain(formatCurrency(MONTHLY_PAYMENT * 12));
  });

  it('keeps Polish characters', async () => {
    const text = await renderText({
      ...SAMPLE_PROPS,
      hoaName: 'Wspólnota Śródmiejska',
      apartmentLabel: 'ul. Żółkiewskiego 5/3',
    });

    expect(text).toContain('Wspólnota Śródmiejska');
    expect(text).toContain('ul. Żółkiewskiego 5/3');
  });
});
