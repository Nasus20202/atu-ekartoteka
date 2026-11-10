import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AdminLayout from '@/app/admin/layout';

vi.mock('@/components/navigation/dashboard-navbar', () => ({
  DashboardNavbar: () => <nav data-testid="admin-navbar" />,
}));

describe('AdminLayout', () => {
  it('renders the navbar and the page without waiting for the access check', () => {
    render(<AdminLayout>{<p>admin page</p>}</AdminLayout>);

    expect(screen.getByTestId('admin-navbar')).toBeInTheDocument();
    expect(screen.getByText('admin page')).toBeInTheDocument();
  });

  it('ends with the footer after the content and fixes no version label', () => {
    render(<AdminLayout>{<p>admin page</p>}</AdminLayout>);

    const footer = screen.getByRole('contentinfo');

    expect(
      screen.getByRole('link', { name: 'Polityka prywatności' })
    ).toHaveAttribute('href', '/privacy');
    expect(
      screen.getByText('admin page').compareDocumentPosition(footer) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(footer.closest('.fixed')).toBeNull();
  });
});
