import Link from 'next/link';

import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/types';

type DashboardNavbarProps = {
  userId: string;
};

export async function DashboardNavbar({ userId }: DashboardNavbarProps) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      role: true,
    },
  });

  if (!userData) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold">
              ATU Ekartoteka
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {userData.role === UserRole.ADMIN && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Panel administratora
                </Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {userData.email}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
