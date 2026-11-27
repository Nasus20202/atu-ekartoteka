import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  // jsdom logs "Not implemented: navigation" when a link's default action runs;
  // the navbar's own onClick handlers are what these tests exercise.
  default: ({
    href,
    onClick,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock('@/components/account/use-logout', () => ({
  useLogout: () => ({ logout: vi.fn(), pending: false }),
}));

import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';

describe('DashboardNavbar', () => {
  describe('Dashboard Mode', () => {
    it('hides the votings link when no count is given', () => {
      render(<DashboardNavbar mode="dashboard" />);

      expect(screen.queryByText('Głosowania')).not.toBeInTheDocument();
    });

    it('links to the votings without a badge when none wait for a vote', () => {
      render(<DashboardNavbar mode="dashboard" pendingVotings={0} />);

      expect(
        screen.getAllByRole('link', { name: /Głosowania/ })[0]
      ).toHaveAttribute('href', '/dashboard/votings');
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows a bell badge with the number of votings waiting for a vote', () => {
      render(<DashboardNavbar mode="dashboard" pendingVotings={3} />);

      expect(
        screen.getAllByRole('status', {
          name: 'Głosowania czekające na Twój głos: 3',
        }).length
      ).toBeGreaterThan(0);
    });

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

    it('renders settings as icon-only links on the right', () => {
      render(<DashboardNavbar mode="admin" />);
      const links = screen.getAllByRole('link', { name: 'Ustawienia' });

      expect(links).toHaveLength(2);
      links.forEach((link) => {
        expect(link).toHaveAttribute('href', '/admin/settings');
        expect(link).not.toHaveTextContent('Ustawienia');
      });
    });

    it('does not render settings outside admin mode', () => {
      render(<DashboardNavbar mode="dashboard" isAdmin />);

      expect(
        screen.queryByRole('link', { name: 'Ustawienia' })
      ).not.toBeInTheDocument();
    });
  });

  describe('Mobile menu', () => {
    const mobileMenu = () => document.getElementById('mobile-navigation');

    it('opens with the toggle and closes after choosing a link', async () => {
      render(<DashboardNavbar mode="dashboard" isAdmin />);
      const toggle = screen.getByRole('button', { name: 'Menu' });

      expect(mobileMenu()).toHaveClass('grid-rows-[0fr]');
      expect(mobileMenu()).toHaveAttribute('inert');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(toggle);
      expect(mobileMenu()).toHaveClass('grid-rows-[1fr]');
      expect(mobileMenu()).not.toHaveAttribute('inert');
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(
        screen.getAllByRole('link', { name: /profil/i })[1]
      );
      expect(mobileMenu()).toHaveClass('grid-rows-[0fr]');

      await userEvent.click(toggle);
      await userEvent.click(
        screen.getAllByRole('link', { name: /panel administratora/i })[1]
      );
      expect(mobileMenu()).toHaveClass('grid-rows-[0fr]');
    });
  });

  describe('Breakpoints', () => {
    it('collapses the admin bar into the menu below the lg breakpoint', () => {
      render(<DashboardNavbar mode="admin" />);
      const toggle = screen.getByRole('button', { name: 'Menu' });

      expect(toggle).toHaveClass('lg:hidden');
      expect(toggle).not.toHaveClass('md:hidden');
    });

    it('keeps the dashboard bar expanded from the md breakpoint', () => {
      render(<DashboardNavbar mode="dashboard" />);

      expect(screen.getByRole('button', { name: 'Menu' })).toHaveClass(
        'md:hidden'
      );
    });
  });

  describe('Admin mobile menu', () => {
    it('closes after choosing the settings link', async () => {
      render(<DashboardNavbar mode="admin" />);
      const toggle = screen.getByRole('button', { name: 'Menu' });

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(
        screen.getAllByRole('link', { name: 'Ustawienia' })[0]
      );

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
