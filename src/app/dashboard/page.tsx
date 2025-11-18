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
import { prisma } from '@/lib/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch user with apartments
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      apartments: {
        orderBy: { number: 'asc' },
      },
    },
  });

  if (!userData) {
    redirect('/login');
  }

  const statusMap = {
    APPROVED: 'Zatwierdzony',
    PENDING: 'Oczekujący',
    REJECTED: 'Odrzucony',
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <nav className="border-b bg-card animate-slide-in-top">
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

      <main className="p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold">
            Witaj{userData.name ? `, ${userData.name}` : ''}!
          </h1>

          <div className="space-y-6">
            {/* Account Status Card */}
            <Card className="animate-scale-in">
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
                      {userData.status === AccountStatus.APPROVED && (
                        <>
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {
                              statusMap[
                                userData.status as keyof typeof statusMap
                              ]
                            }
                          </span>
                        </>
                      )}
                      {userData.status === AccountStatus.PENDING && (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="font-medium text-yellow-600 dark:text-yellow-400">
                            {
                              statusMap[
                                userData.status as keyof typeof statusMap
                              ]
                            }
                          </span>
                        </>
                      )}
                      {userData.status === AccountStatus.REJECTED && (
                        <>
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {
                              statusMap[
                                userData.status as keyof typeof statusMap
                              ]
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {userData.status === 'PENDING' && (
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

                {userData.status === 'REJECTED' && (
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
                    <span className="font-medium">{userData.email}</span>
                  </div>
                  {userData.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Imię i nazwisko:
                      </span>
                      <span className="font-medium">{userData.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Apartments Card */}
            {userData.status === 'APPROVED' && (
              <Card
                className="animate-scale-in"
                style={{ animationDelay: '100ms' }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {userData.apartments.length === 0
                      ? 'Mieszkanie'
                      : userData.apartments.length === 1
                        ? 'Mieszkanie'
                        : `Mieszkania (${userData.apartments.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userData.apartments.length > 0 ? (
                    <div className="space-y-4">
                      {userData.apartments.map((apartment, index) => (
                        <div
                          key={apartment.id}
                          className="rounded-lg border bg-muted/50 p-4"
                          style={{
                            animationDelay: `${100 + index * 50}ms`,
                          }}
                        >
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {apartment.address} {apartment.number}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {apartment.postalCode} {apartment.city}
                              </p>
                            </div>
                            {apartment.isActive ? (
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
                            {apartment.owner && (
                              <div>
                                <dt className="text-sm text-muted-foreground">
                                  Właściciel
                                </dt>
                                <dd className="font-medium">
                                  {apartment.owner}
                                </dd>
                              </div>
                            )}
                            {apartment.building && (
                              <div>
                                <dt className="text-sm text-muted-foreground">
                                  Budynek
                                </dt>
                                <dd className="font-medium">
                                  {apartment.building}
                                </dd>
                              </div>
                            )}
                            {apartment.area && (
                              <div>
                                <dt className="text-sm text-muted-foreground">
                                  Powierzchnia
                                </dt>
                                <dd className="font-medium">
                                  {apartment.area ? apartment.area / 100 : '-'}{' '}
                                  m²
                                </dd>
                              </div>
                            )}
                            {apartment.height && (
                              <div>
                                <dt className="text-sm text-muted-foreground">
                                  Wysokość
                                </dt>
                                <dd className="font-medium">
                                  {apartment.height
                                    ? apartment.height / 100
                                    : '-'}{' '}
                                  cm
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      ))}
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
