import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentApartmentSection } from '@/components/payments/payment-apartment-section';
import { PaymentChartSection } from '@/components/payments/payment-chart-section';
import { PaymentDetailsHeader } from '@/components/payments/payment-details-header';
import { PaymentSummarySection } from '@/components/payments/payment-summary-section';
import { PaymentTableSection } from '@/components/payments/payment-table-section';

const mocks = vi.hoisted(() => ({
  loadPaymentDetails: vi.fn(),
  chart: vi.fn(),
  apartmentCard: vi.fn(),
  table: vi.fn(),
  yearSelect: vi.fn(),
  pdfButton: vi.fn(),
}));

vi.mock(
  '@/app/dashboard/payments/[apartmentId]/[year]/load-payment-details',
  () => ({ loadPaymentDetails: mocks.loadPaymentDetails })
);
vi.mock(
  '@/app/dashboard/payments/[apartmentId]/[year]/payment-summary',
  () => ({
    getPaymentSummary: () => ({
      totalPayments: 1200,
      totalCharges: 1000,
      openingBalance: -50,
      closingBalance: 150,
    }),
  })
);
vi.mock('@/components/charts/chart-data', () => ({
  getPaymentMonthlyChartData: () => ['chart-data'],
}));
vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({
    title,
    description,
    action,
  }: {
    title: string;
    description: string;
    action: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {action}
    </div>
  ),
}));
vi.mock('@/components/payments/payment-monthly-chart-card', () => ({
  PaymentMonthlyChartCard: (props: unknown) => {
    mocks.chart(props);
    return <div>chart</div>;
  },
}));
vi.mock('@/components/payments/payment-apartment-details-card', () => ({
  PaymentApartmentDetailsCard: (props: unknown) => {
    mocks.apartmentCard(props);
    return <div>apartment-card</div>;
  },
}));
vi.mock('@/components/payments/payment-table', () => ({
  PaymentTable: (props: unknown) => {
    mocks.table(props);
    return <div>table</div>;
  },
}));
vi.mock('@/components/payments/payment-year-select', () => ({
  PaymentYearSelect: (props: unknown) => {
    mocks.yearSelect(props);
    return <div>year-select</div>;
  },
}));
vi.mock('@/components/pdf/download-payment-pdf-button', () => ({
  DownloadPaymentPdfButton: (props: unknown) => {
    mocks.pdfButton(props);
    return <div>pdf</div>;
  },
}));
vi.mock('@/lib/types/dto/payment-dto', () => ({
  toPaymentPdfDto: (payment: unknown) => ({ pdf: payment }),
}));
vi.mock('@/lib/utils/apartment-label', () => ({
  formatApartmentLabel: () => 'Długa 1/2',
}));

const params = Promise.resolve({ apartmentId: 'apt-1', year: '2025' });
const payment = {
  year: 2025,
  dateFrom: new Date('2025-01-01T00:00:00Z'),
  dateTo: new Date('2025-12-31T00:00:00Z'),
};
const apartment = {
  id: 'apt-1',
  address: null,
  building: '1',
  number: '2',
  postalCode: null,
  city: null,
  shareRatio: 0.5,
  homeownersAssociation: { name: 'Wspólnota A' },
};

describe('payment detail sections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPaymentDetails.mockResolvedValue({
      apartment,
      payment,
      paymentYears: [2025, 2024],
      cutoffPeriod: '2025-03',
    });
  });

  it('PaymentChartSection renders the monthly chart', async () => {
    render(await PaymentChartSection({ params }));

    expect(mocks.loadPaymentDetails).toHaveBeenCalledWith('apt-1', '2025');
    expect(mocks.chart).toHaveBeenCalledWith({ data: ['chart-data'] });
  });

  it('PaymentApartmentSection passes empty strings for missing address parts', async () => {
    render(await PaymentApartmentSection({ params }));

    expect(mocks.apartmentCard).toHaveBeenCalledWith({
      address: '',
      building: '1',
      number: '2',
      postalCode: '',
      city: '',
      shareRatio: 0.5,
    });
  });

  it('PaymentTableSection renders the table with the cutoff period', async () => {
    render(await PaymentTableSection({ params }));

    expect(
      screen.getByText('Wpłaty i naliczenia miesięczne')
    ).toBeInTheDocument();
    expect(mocks.table).toHaveBeenCalledWith({
      payment,
      apartmentId: 'apt-1',
      cutoffPeriod: '2025-03',
    });
  });

  it('PaymentSummarySection shows the balances and the PDF download', async () => {
    render(await PaymentSummarySection({ params }));

    expect(screen.getByText('Podsumowanie roku 2025')).toBeInTheDocument();
    expect(screen.getByText('Saldo początkowe')).toBeInTheDocument();
    expect(screen.getByText('Saldo końcowe')).toBeInTheDocument();
    expect(mocks.pdfButton).toHaveBeenCalledWith({
      apartmentLabel: 'Długa 1/2',
      hoaName: 'Wspólnota A',
      payment: { pdf: payment },
    });
  });

  it('PaymentDetailsHeader offers the year select with several years', async () => {
    render(await PaymentDetailsHeader({ params }));

    expect(screen.getByText('Wpłaty - Długa 1/2')).toBeInTheDocument();
    expect(screen.getByText('Szczegóły wpłat za rok 2025')).toBeInTheDocument();
    expect(mocks.yearSelect).toHaveBeenCalledWith({
      apartmentId: 'apt-1',
      year: 2025,
      years: [2025, 2024],
    });
  });

  it('PaymentDetailsHeader hides the year select for a single year', async () => {
    mocks.loadPaymentDetails.mockResolvedValue({
      apartment,
      payment,
      paymentYears: [2025],
      cutoffPeriod: '2025-03',
    });

    render(await PaymentDetailsHeader({ params }));

    expect(screen.queryByText('year-select')).not.toBeInTheDocument();
  });
});
