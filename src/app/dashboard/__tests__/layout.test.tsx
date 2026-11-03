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
});
