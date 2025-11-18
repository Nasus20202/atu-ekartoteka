import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { UserRole } from '@/lib/types';

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role === UserRole.ADMIN) {
    redirect('/admin/apartments');
  }

  redirect('/dashboard');
}
