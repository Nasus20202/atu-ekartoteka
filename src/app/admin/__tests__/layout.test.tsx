import { render, screen } from '@testing-library/react';
import { use } from 'react';
import { describe, expect, it, vi } from 'vitest';

import AdminLayout from '@/app/admin/layout';

const pending = vi.hoisted(() => ({ value: false }));

vi.mock('@/components/navigation/dashboard-navbar', () => ({
  DashboardNavbar: () => <nav data-testid="admin-navbar" />,
}));
vi.mock('@/components/navigation/admin-access-guard', () => ({
  AdminAccessGuard: ({ children }: { children: React.ReactNode }) => {
    if (pending.value) use(new Promise<never>(() => {}));
    return <>{children}</>;
  },
}));

describe('AdminLayout', () => {
  it('shows the navbar and a page skeleton while access is checked', () => {
    pending.value = true;

    render(<AdminLayout>{<p>admin page</p>}</AdminLayout>);

    expect(screen.getByTestId('admin-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('admin-page-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });

  it('renders the admin page once access is granted', () => {
    pending.value = false;

    render(<AdminLayout>{<p>admin page</p>}</AdminLayout>);

    expect(screen.getByText('admin page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-page-skeleton')).not.toBeInTheDocument();
  });
});
