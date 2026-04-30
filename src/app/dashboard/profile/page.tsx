import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ProfileForm } from '@/components/account/profile-form';
import { Page } from '@/components/layout/page';
import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { findUserProfileCached } from '@/lib/queries/users/find-user-profile';
import { AuthMethod } from '@/lib/types';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserProfileCached(session.user.id);

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
          <ProfileForm
            initialName={user.name}
            authMethod={user.authMethod || AuthMethod.CREDENTIALS}
          />
        </CardContent>
      </Card>
    </Page>
  );
}
