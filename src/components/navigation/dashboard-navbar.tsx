'use client';

import { Menu, Settings, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { LogoutButton } from '@/components/account/logout-button';
import { NAVBAR_BREAKPOINT_CLASSES } from '@/components/navigation/navbar-breakpoints';
import {
  getNavigationItems,
  isCurrentPath,
  type NavbarMode,
} from '@/components/navigation/navigation-items';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';

const MOBILE_MENU_ID = 'mobile-navigation';
const MOBILE_MENU_LABEL = 'Menu';
const SETTINGS_HREF = '/admin/settings';
const SETTINGS_LABEL = 'Ustawienia';
const PROFILE_HREF = '/dashboard/profile';
const CURRENT_CLASSES = 'bg-accent text-accent-foreground';

type DashboardNavbarProps = {
  mode?: NavbarMode;
  isAdmin?: boolean;
};

export function DashboardNavbar({
  mode = 'dashboard',
  isAdmin = false,
}: DashboardNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const pathname = usePathname() ?? '';
  const navigationItems = getNavigationItems(mode, isAdmin);
  const currentPage = (href: string) =>
    isCurrentPath(pathname, href) ? ('page' as const) : undefined;

  const showProfileLink = mode === 'dashboard';
  const breakpoint = NAVBAR_BREAKPOINT_CLASSES[mode];
  const settingsLink = mode === 'admin' && (
    <Button
      variant="ghost"
      size="icon"
      className={cn(currentPage(SETTINGS_HREF) && CURRENT_CLASSES)}
      asChild
    >
      <Link
        href={SETTINGS_HREF}
        aria-current={currentPage(SETTINGS_HREF)}
        aria-label={SETTINGS_LABEL}
        title={SETTINGS_LABEL}
        onClick={() => setIsOpen(false)}
      >
        <Settings />
      </Link>
    </Button>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href={mode === 'admin' ? '/admin' : '/dashboard'}
              className="text-xl font-bold"
            >
              ATU Ekartoteka
            </Link>
            <div className={breakpoint.links}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const current = currentPage(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={current}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
                      current && CURRENT_CLASSES
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={breakpoint.actions}>
            {showProfileLink && (
              <Link
                href={PROFILE_HREF}
                aria-current={currentPage(PROFILE_HREF)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(currentPage(PROFILE_HREF) && CURRENT_CLASSES)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Button>
              </Link>
            )}
            {settingsLink}
            <ThemeToggle />
            <LogoutButton />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn('rounded-md p-2 hover:bg-accent', breakpoint.toggle)}
            aria-label={MOBILE_MENU_LABEL}
            aria-expanded={isOpen}
            aria-controls={MOBILE_MENU_ID}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div
          id={MOBILE_MENU_ID}
          inert={!isOpen}
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
            breakpoint.menu,
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-2 pb-4 pt-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={currentPage(item.href)}
                    onClick={() => setIsOpen(false)}
                    className="block"
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start',
                        currentPage(item.href) && CURRENT_CLASSES
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
              {showProfileLink && (
                <Link
                  href={PROFILE_HREF}
                  aria-current={currentPage(PROFILE_HREF)}
                  onClick={() => setIsOpen(false)}
                  className="block"
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start',
                      currentPage(PROFILE_HREF) && CURRENT_CLASSES
                    )}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2 px-3 py-2">
                {settingsLink}
                <ThemeToggle />
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
