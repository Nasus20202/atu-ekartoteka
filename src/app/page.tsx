import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { isAdminRole } from '@/lib/auth/admin-access';

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (isAdminRole(session.user.role)) {
    redirect('/admin/apartments');
  }

  redirect('/dashboard');
}
