import type { ReactNode } from 'react';

export interface DashboardShellProps {
  greeting: ReactNode;
  notifications: ReactNode;
  main: ReactNode;
}

/** Dashboard layout shared by the page and its loading skeleton, so both render the same grid. */
export function DashboardShell({
  greeting,
  notifications,
  main,
}: DashboardShellProps) {
  return (
    <div className="w-full flex-1 bg-background">
      <main className="p-4 md:p-8">
        <div className="mx-auto w-full max-w-7xl">
          {greeting}

          <div className="grid grid-cols-1 gap-6 lg:items-start lg:has-[aside>*]:grid-cols-[minmax(0,1fr)_350px]">
            {/* Shows first on mobile, second on desktop */}
            <aside className="empty:hidden lg:order-2 lg:self-start lg:sticky lg:top-20">
              {notifications}
            </aside>

            <div className="space-y-6 lg:order-1">{main}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
