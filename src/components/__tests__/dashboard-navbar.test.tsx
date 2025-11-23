import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardNavbar } from '@/components/dashboard-navbar';

describe('DashboardNavbar', () => {
  describe('Dashboard Mode', () => {
    it('renders navbar with profile button', () => {
      render(<DashboardNavbar mode="dashboard" isAdmin={false} />);
      expect(screen.getByText('ATU Ekartoteka')).toBeInTheDocument();
      const profileButtons = screen.getAllByRole('button', { name: /profil/i });
      expect(profileButtons.length).toBeGreaterThan(0);
    });

    it('renders admin panel button for admin users', () => {
      render(<DashboardNavbar mode="dashboard" isAdmin={true} />);
      const adminButtons = screen.getAllByRole('button', {
        name: /panel administratora/i,
      });
      expect(adminButtons.length).toBeGreaterThan(0);
    });

    it('does not render admin panel button for regular users', () => {
      render(<DashboardNavbar mode="dashboard" isAdmin={false} />);
      expect(
        screen.queryByRole('button', { name: /panel administratora/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Admin Mode', () => {
    it('renders navbar with all admin navigation items', () => {
      render(<DashboardNavbar mode="admin" />);
      expect(screen.getByText('ATU Ekartoteka')).toBeInTheDocument();
      expect(screen.getAllByText('Panel klienta').length).toBe(2);
      expect(screen.getAllByText('Mieszkania').length).toBe(2);
    });
  });
});
