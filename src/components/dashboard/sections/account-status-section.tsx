import { loadAccountUser } from '@/app/dashboard/dashboard-loaders';
import { UserStatusSection } from '@/components/account/user-status-section';
import { REVEAL_CLASS } from '@/components/layout/reveal';

export async function AccountStatusSection() {
  const user = await loadAccountUser();

  if (!user) {
    return null;
  }

  return (
    <div className={REVEAL_CLASS}>
      <UserStatusSection
        name={user.name}
        email={user.email}
        status={user.status}
      />
    </div>
  );
}
