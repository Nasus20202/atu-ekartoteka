import { AdminImportContent } from '@/components/import/admin-import-content';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';

export default async function AdminImportPage() {
  await requireAdminAccess();

  return <AdminImportContent />;
}
