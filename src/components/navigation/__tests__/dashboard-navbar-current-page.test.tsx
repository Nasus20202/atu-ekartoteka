import { render, screen } from '@testing-library/react';
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

const location = vi.hoisted(() => ({ pathname: '/dashboard' }));

vi.mock('next/navigation', () => ({
  usePathname: () => location.pathname,
}));

vi.mock('@/components/account/use-logout', () => ({
  useLogout: () => ({ logout: vi.fn(), pending: false }),
}));

import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';

describe('DashboardNavbar current page', () => {
  // One link in the bar and one in the mobile menu
  const links = (name: string) => screen.getAllByRole('link', { name });

  it.each(['/dashboard/settlements', '/dashboard/settlements/archive'])(
    'marks Rozliczenia on %s',
    (pathname) => {
      location.pathname = pathname;

      render(<DashboardNavbar mode="dashboard" />);

      expect(links('Rozliczenia')).toHaveLength(2);
      links('Rozliczenia').forEach((link) => {
        expect(link).toHaveAttribute('href', '/dashboard/settlements');
        expect(link).toHaveAttribute('aria-current', 'page');
      });
      links('Profil').forEach((link) =>
        expect(link).not.toHaveAttribute('aria-current')
      );
    }
  );

  it.each(['/dashboard', '/dashboard/settlements-old'])(
    'marks nothing as Rozliczenia on %s',
    (pathname) => {
      location.pathname = pathname;

      render(<DashboardNavbar mode="dashboard" isAdmin />);

      links('Rozliczenia').forEach((link) =>
        expect(link).not.toHaveAttribute('aria-current')
      );
    }
  );

  it('marks the profile link on the profile page', () => {
    location.pathname = '/dashboard/profile';

    render(<DashboardNavbar mode="dashboard" />);

    links('Profil').forEach((link) =>
      expect(link).toHaveAttribute('aria-current', 'page')
    );
  });

  it.each([
    ['/admin/apartments/h1/a1', 'Mieszkania'],
    ['/admin/import', 'Import'],
    ['/admin/users/management', 'Użytkownicy'],
    ['/admin/settings', 'Ustawienia'],
  ])('marks the link of %s in the admin bar', (pathname, name) => {
    location.pathname = pathname;

    render(<DashboardNavbar mode="admin" />);

    const marked = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(marked).toEqual(links(name));
    // Highlighted for the eye too, on the link or on the button inside it
    marked.forEach((link) =>
      expect(link.querySelector('button') ?? link).toHaveClass('bg-accent')
    );
  });
});
