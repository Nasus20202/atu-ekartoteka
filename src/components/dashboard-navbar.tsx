import { Cog, User } from 'lucide-react';
import Link from 'next/link';

import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/database/prisma';
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
            {userData.role === UserRole.ADMIN && (
              <Link href="/admin">
                <Button variant="ghost">
                  <Cog className="mr-2 h-4 w-4" />
                  Panel administratora
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                Profil
              </Button>
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
