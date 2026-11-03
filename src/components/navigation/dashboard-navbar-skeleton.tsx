import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';

export function DashboardNavbarSkeleton() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold">
            ATU Ekartoteka
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-10 w-10 md:hidden" />
        </div>
      </div>
    </nav>
  );
}
