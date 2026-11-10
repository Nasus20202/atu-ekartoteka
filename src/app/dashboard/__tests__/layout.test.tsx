import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DashboardLayout from '@/app/dashboard/layout';

vi.mock('@/components/navigation/dashboard-chrome', () => ({
  DashboardChrome: () => <nav data-testid="chrome" />,
}));

describe('DashboardLayout', () => {
  it('renders the page content and the streamed chrome', () => {
    render(<DashboardLayout>{<p>page content</p>}</DashboardLayout>);

    expect(screen.getByText('page content')).toBeInTheDocument();
    expect(screen.getByTestId('chrome')).toBeInTheDocument();
  });

  it('ends with the footer after the content and fixes no version label', () => {
    render(<DashboardLayout>{<p>page content</p>}</DashboardLayout>);

    const footer = screen.getByRole('contentinfo');
    const content = screen.getByText('page content');

    expect(
      screen.getByRole('link', { name: 'Polityka prywatności' })
    ).toHaveAttribute('href', '/privacy');
    expect(
      content.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(footer.closest('.fixed')).toBeNull();
  });
});
