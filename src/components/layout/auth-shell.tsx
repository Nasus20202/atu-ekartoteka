import { ReactNode } from 'react';

import { AppFooter } from '@/components/layout/app-footer';
import { AuthSkyline } from '@/components/layout/auth-skyline';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface AuthShellProps {
  children: ReactNode;
}

/**
 * Backdrop shared by the auth pages. It lives in the route group's layout, so
 * the skyline stays mounted while the card changes between pages.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background animate-fade-in">
      <AuthSkyline />
      <div className="fixed right-4 top-4 z-10 animate-slide-in-top">
        <ThemeToggle />
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        {children}
      </div>
      <AppFooter />
    </div>
  );
}
