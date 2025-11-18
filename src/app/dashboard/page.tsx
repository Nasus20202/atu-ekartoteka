import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  Mail,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/lib/types';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const statusMap = {
    APPROVED: 'Zatwierdzony',
    PENDING: 'Oczekujący',
    REJECTED: 'Odrzucony',
  };

  const user = session.user as {
    email: string;
    name?: string | null;
    role: string;
    status: string;
    apartment?: {
      id: string;
      externalId: string;
      owner?: string | null;
      address?: string | null;
      building?: string | null;
      number: string;
      postalCode?: string | null;
      city?: string | null;
      area?: number | null;
      height?: number | null;
      isActive: boolean;
    } | null;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold">
                ATU Ekartoteka
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {user.role === UserRole.ADMIN && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Panel administratora
                  </Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold">
            Witaj{user.name ? `, ${user.name}` : ''}!
          </h1>

          <div className="space-y-6">
            {/* Account Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Status konta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Status zatwierdzenia
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {user.status === 'APPROVED' && (
                        <>
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {statusMap[user.status as keyof typeof statusMap]}
                          </span>
                        </>
                      )}
                      {user.status === 'PENDING' && (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="font-medium text-yellow-600 dark:text-yellow-400">
                            {statusMap[user.status as keyof typeof statusMap]}
                          </span>
                        </>
                      )}
                      {user.status === 'REJECTED' && (
                        <>
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {statusMap[user.status as keyof typeof statusMap]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {user.status === 'PENDING' && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-200">
                          Konto oczekuje na zatwierdzenie
                        </p>
                        <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                          Twoje konto zostanie sprawdzone przez administratora.
                          Po zatwierdzeniu otrzymasz dostęp do pełnej
                          funkcjonalności systemu.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {user.status === 'REJECTED' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                    <div className="flex items-start gap-3">
                      <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-200">
                          Konto zostało odrzucone
                        </p>
                        <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                          Skontaktuj się z administratorem, aby uzyskać więcej
                          informacji.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  {user.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Imię i nazwisko:
                      </span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Apartment Card */}
            {user.status === 'APPROVED' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Mieszkanie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.apartment ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {user.apartment.address} {user.apartment.number}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {user.apartment.postalCode} {user.apartment.city}
                            </p>
                          </div>
                          {user.apartment.isActive ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              Aktywne
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              Nieaktywne
                            </span>
                          )}
                        </div>

                        <dl className="grid gap-3 sm:grid-cols-2">
                          {user.apartment.owner && (
                            <div>
                              <dt className="text-sm text-muted-foreground">
                                Właściciel
                              </dt>
                              <dd className="font-medium">
                                {user.apartment.owner}
                              </dd>
                            </div>
                          )}
                          {user.apartment.building && (
                            <div>
                              <dt className="text-sm text-muted-foreground">
                                Budynek
                              </dt>
                              <dd className="font-medium">
                                {user.apartment.building}
                              </dd>
                            </div>
                          )}
                          {user.apartment.area && (
                            <div>
                              <dt className="text-sm text-muted-foreground">
                                Powierzchnia
                              </dt>
                              <dd className="font-medium">
                                {user.apartment.area} m²
                              </dd>
                            </div>
                          )}
                          {user.apartment.height && (
                            <div>
                              <dt className="text-sm text-muted-foreground">
                                Wysokość
                              </dt>
                              <dd className="font-medium">
                                {user.apartment.height} cm
                              </dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-sm text-muted-foreground">
                              ID zewnętrzne
                            </dt>
                            <dd className="font-mono text-sm">
                              {user.apartment.externalId}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-200">
                            Brak przypisanego mieszkania
                          </p>
                          <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                            Administrator jeszcze nie przypisał Ci mieszkania.
                            Skontaktuj się z administratorem, jeśli uważasz, że
                            to błąd.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
