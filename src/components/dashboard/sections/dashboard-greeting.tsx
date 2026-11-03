import { loadAccountUser } from '@/app/dashboard/dashboard-loaders';
import { OrphanedSessionSignOut } from '@/components/account/orphaned-session-sign-out';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { cn } from '@/lib/utils';

export async function DashboardGreeting() {
  const user = await loadAccountUser();

  if (!user) {
    return <OrphanedSessionSignOut />;
  }

  return (
    <h1 className={cn('mb-6 text-3xl font-bold', REVEAL_CLASS)}>
      Witaj{user.name ? `, ${user.name}` : ''}!
    </h1>
  );
}
