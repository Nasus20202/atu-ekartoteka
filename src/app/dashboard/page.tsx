import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  const roleMap = {
    ADMIN: 'Administrator',
    TENANT: 'Najemca',
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Panel główny</h1>
          <ThemeToggle />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Witaj!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Email:</span> {session.user.email}
              </p>
              <p>
                <span className="font-medium">Imię i nazwisko:</span>{' '}
                {session.user.name}
              </p>
              <p>
                <span className="font-medium">Rola:</span>{' '}
                {roleMap[session.user.role as keyof typeof roleMap]}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    session.user.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : session.user.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {statusMap[session.user.status as keyof typeof statusMap]}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
