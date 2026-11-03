import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import PaymentDetailsPage from '@/app/dashboard/payments/[apartmentId]/[year]/page';

const pending = vi.hoisted(() => ({ name: '' }));

vi.mock('@/components/payments/payment-details-header', () => ({
  PaymentDetailsHeader: () => {
    if (pending.name === 'header') use(new Promise<never>(() => {}));
    return <div>header-loaded</div>;
  },
}));
vi.mock('@/components/payments/payment-summary-section', () => ({
  PaymentSummarySection: () => {
    if (pending.name === 'summary') use(new Promise<never>(() => {}));
    return <div>summary-loaded</div>;
  },
}));
vi.mock('@/components/payments/payment-chart-section', () => ({
  PaymentChartSection: () => {
    if (pending.name === 'chart') use(new Promise<never>(() => {}));
    return <div>chart-loaded</div>;
  },
}));
vi.mock('@/components/payments/payment-table-section', () => ({
  PaymentTableSection: () => {
    if (pending.name === 'table') use(new Promise<never>(() => {}));
    return <div>table-loaded</div>;
  },
}));
vi.mock('@/components/payments/payment-apartment-section', () => ({
  PaymentApartmentSection: () => {
    if (pending.name === 'apartment') use(new Promise<never>(() => {}));
    return <div>apartment-loaded</div>;
  },
}));
vi.mock('@/lib/metadata/page-titles', () => ({
  getPaymentsYearTitle: vi.fn(),
}));

const SECTIONS = ['header', 'summary', 'chart', 'table', 'apartment'];

describe('PaymentDetailsPage', () => {
  it.each(SECTIONS)(
    'keeps the other sections visible while %s is still loading',
    (name) => {
      pending.name = name;

      const { container } = render(
        <PaymentDetailsPage
          params={Promise.resolve({ apartmentId: 'apt-1', year: '2026' })}
        />
      );

      expect(screen.queryByText(`${name}-loaded`)).not.toBeInTheDocument();
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
      for (const other of SECTIONS.filter((item) => item !== name)) {
        expect(screen.getByText(`${other}-loaded`)).toBeInTheDocument();
      }
    }
  );
});
