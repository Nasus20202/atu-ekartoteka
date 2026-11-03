import { redirect } from 'next/navigation';

import { ProfileForm } from '@/components/account/profile-form';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getSession } from '@/lib/auth/get-session';
import { findUserProfileCached } from '@/lib/queries/users/find-user-profile';
import { AuthMethod } from '@/lib/types';

export async function ProfileContent() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserProfileCached(session.user.id);

  if (!user) {
    redirect('/login');
  }

  return (
    <Card className={REVEAL_CLASS}>
      <CardHeader>
        <CardTitle>Edytuj profil</CardTitle>
        <CardDescription>Zmień swoje imię i nazwisko lub hasło</CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm
          initialName={user.name}
          authMethod={user.authMethod || AuthMethod.CREDENTIALS}
        />
      </CardContent>
    </Card>
  );
}
