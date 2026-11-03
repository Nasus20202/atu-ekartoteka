import { buildDashboardNotifications } from '@/app/dashboard/dashboard-data';
import {
  loadAccountUser,
  loadDashboardUser,
} from '@/app/dashboard/dashboard-loaders';
import { NotificationsSidebar } from '@/components/dashboard/notifications-sidebar';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { isApprovedAccount } from '@/lib/auth/account-access';

export async function NotificationsSection() {
  const [account, user] = await Promise.all([
    loadAccountUser(),
    loadDashboardUser(),
  ]);

  if (!account || !user || !isApprovedAccount(account)) {
    return null;
  }

  const notifications = buildDashboardNotifications(user.apartments);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={REVEAL_CLASS}>
      <NotificationsSidebar notifications={notifications} />
    </div>
  );
}
