import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { Building2, Upload, Users, Home } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const navigation = [
    { name: 'Panel mieszkańca', href: '/dashboard', icon: Home },
    { name: 'Mieszkania', href: '/admin/apartments', icon: Building2 },
    { name: 'Import', href: '/admin/import', icon: Upload },
    { name: 'Użytkownicy', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold">
                ATU Ekartoteka
              </Link>
              <div className="hidden md:flex md:gap-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
