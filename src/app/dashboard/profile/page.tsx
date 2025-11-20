import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Page } from '@/components/page';
import { PageHeader } from '@/components/page-header';
import { ProfileForm } from '@/components/profile-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

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
    <Page maxWidth="2xl">
      <PageHeader
        title="Profil"
        description="Zarządzaj swoimi danymi osobowymi"
      />

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
    </Page>
  );
}
