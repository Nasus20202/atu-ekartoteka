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
import { AuthMethod } from '@/lib/auth/types/account';
import { getSession } from '@/lib/framework/auth/get-session';
import { findUserProfile } from '@/lib/users/queries/find-user-profile';

export async function ProfileContent() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserProfile(session.user.id);

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
