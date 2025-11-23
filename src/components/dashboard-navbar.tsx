'use client';

import {
  Building2,
  Cog,
  Home,
  type LucideIcon,
  Menu,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

type NavbarMode = 'dashboard' | 'admin';

type DashboardNavbarProps = {
  mode?: NavbarMode;
  isAdmin?: boolean;
};

const adminNavigation: NavItem[] = [
  { name: 'Panel klienta', href: '/dashboard', icon: Home },
  { name: 'Mieszkania', href: '/admin/apartments', icon: Building2 },
  { name: 'Import', href: '/admin/import', icon: Upload },
  { name: 'Użytkownicy', href: '/admin/users', icon: Users },
];

const dashboardAdminNavigation: NavItem[] = [
  { name: 'Panel administratora', href: '/admin', icon: Cog },
];

export function DashboardNavbar({
  mode = 'dashboard',
  isAdmin = false,
}: DashboardNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine navigation items based on mode
  const navigationItems =
    mode === 'admin'
      ? adminNavigation
      : isAdmin
        ? dashboardAdminNavigation
        : [];

  const showProfileLink = mode === 'dashboard';

  return (
    <nav className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold">
              ATU Ekartoteka
            </Link>
            {navigationItems.length > 0 && (
              <div className="hidden md:flex md:gap-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 md:flex">
            {showProfileLink && (
              <Link href="/dashboard/profile">
                <Button variant="ghost" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Button>
              </Link>
            )}
            <ThemeToggle />
            <LogoutButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-md p-2 hover:bg-accent"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-2 pb-4 pt-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block"
                >
                  <Button variant="ghost" className="w-full justify-start">
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
            {showProfileLink && (
              <Link
                href="/dashboard/profile"
                onClick={() => setIsOpen(false)}
                className="block"
              >
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2 px-3 py-2">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
