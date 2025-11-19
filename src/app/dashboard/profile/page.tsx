import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { BackButton } from '@/components/back-button';
import { ProfileForm } from '@/components/profile-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <BackButton />
          <h1 className="mt-4 text-3xl font-bold">Profil</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoimi danymi osobowymi
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edytuj profil</CardTitle>
            <CardDescription>
              Zmień swoje imię i nazwisko lub hasło
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialName={user.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
