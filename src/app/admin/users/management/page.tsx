import { BulkCreateUsersContent } from '@/components/users/management/bulk-create-users-content';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';

export default async function BulkCreateUsersPage() {
  await requireAdminAccess();

  return <BulkCreateUsersContent />;
}
