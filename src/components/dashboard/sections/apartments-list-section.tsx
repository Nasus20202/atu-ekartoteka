import {
  loadAccountUser,
  loadApartmentsWithCharges,
} from '@/app/dashboard/dashboard-loaders';
import { ApartmentsSection } from '@/components/dashboard/apartments-section';
import { REVEAL_CLASS } from '@/components/layout/reveal';
import { isApprovedAccount } from '@/lib/auth/account-access';

export async function ApartmentsListSection() {
  const [account, apartments] = await Promise.all([
    loadAccountUser(),
    loadApartmentsWithCharges(),
  ]);

  if (!account || !isApprovedAccount(account)) {
    return null;
  }

  return (
    <div className={REVEAL_CLASS}>
      <ApartmentsSection apartments={apartments} />
    </div>
  );
}
