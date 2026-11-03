import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import DashboardPage from '@/app/dashboard/page';

const pending = vi.hoisted(() => ({ section: '' }));

function section(name: string, label: string) {
  return function Section() {
    if (pending.section === name) {
      use(new Promise<never>(() => {}));
    }

    return <div>{label}</div>;
  };
}

vi.mock('@/components/dashboard/sections/dashboard-greeting', () => ({
  DashboardGreeting: section('greeting', 'greeting-loaded'),
}));
vi.mock('@/components/dashboard/sections/account-status-section', () => ({
  AccountStatusSection: section('status', 'status-loaded'),
}));
vi.mock('@/components/dashboard/sections/payments-section', () => ({
  PaymentsSection: section('payments', 'payments-loaded'),
}));
vi.mock('@/components/dashboard/sections/charges-section', () => ({
  ChargesSection: section('charges', 'charges-loaded'),
}));
vi.mock('@/components/dashboard/sections/apartments-list-section', () => ({
  ApartmentsListSection: section('apartments', 'apartments-loaded'),
}));
vi.mock('@/components/dashboard/sections/notifications-section', () => ({
  NotificationsSection: section('notifications', 'notifications-loaded'),
}));

const SECTIONS = [
  'greeting',
  'status',
  'payments',
  'charges',
  'apartments',
  'notifications',
];

describe('DashboardPage', () => {
  it('renders every section once its data is ready', () => {
    pending.section = '';

    render(<DashboardPage />);

    for (const name of SECTIONS) {
      expect(screen.getByText(`${name}-loaded`)).toBeInTheDocument();
    }
  });

  it.each(SECTIONS)(
    'keeps the other sections visible while %s is still loading',
    (name) => {
      pending.section = name;

      const { container } = render(<DashboardPage />);

      expect(screen.queryByText(`${name}-loaded`)).not.toBeInTheDocument();
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
      for (const other of SECTIONS.filter((item) => item !== name)) {
        expect(screen.getByText(`${other}-loaded`)).toBeInTheDocument();
      }
    }
  );
});
