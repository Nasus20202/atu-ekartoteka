import { ReactNode } from 'react';

import packageJson from '@/../package.json';
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 animate-fade-in">
      <AuthSkyline />
      <div className="fixed right-4 top-4 z-10 animate-slide-in-top">
        <ThemeToggle />
      </div>
      <div className="fixed bottom-4 left-4 z-10 animate-fade-in">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
      {children}
    </div>
  );
}
