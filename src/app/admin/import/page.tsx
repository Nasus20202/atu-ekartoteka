import { AdminImportContent } from '@/components/import/admin-import-content';
import { requireAdminAccess } from '@/lib/framework/auth/require-admin-access';

export default async function AdminImportPage() {
  await requireAdminAccess();

  return <AdminImportContent />;
}
