import { SettingsContent } from '@/components/settings/settings-content';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import { getAppSettings } from '@/lib/queries/settings/get-app-settings';

/** Stored (not cached) values, so the form always starts from the database. */
export async function SettingsSection() {
  await requireAdminAccess();
  const { tenantHistoryYearsBack } = await getAppSettings();

  return <SettingsContent initialYearsBack={tenantHistoryYearsBack} />;
}
