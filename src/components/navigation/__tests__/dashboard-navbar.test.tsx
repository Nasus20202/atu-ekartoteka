import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';

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

  describe('Mobile menu', () => {
    const mobileMenu = () =>
      screen
        .getAllByRole('link', { name: /profil/i })[1]
        .closest('.overflow-hidden');

    it('opens with the toggle and closes after choosing a link', async () => {
      render(<DashboardNavbar mode="dashboard" isAdmin />);
      const toggle = screen.getByRole('button', { name: 'Menu' });

      expect(mobileMenu()).toHaveClass('max-h-0');
      expect(mobileMenu()).toHaveAttribute('inert');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(toggle);
      expect(mobileMenu()).toHaveClass('max-h-96');
      expect(mobileMenu()).not.toHaveAttribute('inert');
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(
        screen.getAllByRole('link', { name: /profil/i })[1]
      );
      expect(mobileMenu()).toHaveClass('max-h-0');

      await userEvent.click(toggle);
      await userEvent.click(
        screen.getAllByRole('link', { name: /panel administratora/i })[1]
      );
      expect(mobileMenu()).toHaveClass('max-h-0');
    });
  });
});
