import { REVEAL_CLASS } from '@/components/layout/reveal';
import { SettingsContent } from '@/components/settings/settings-content';
import { requireAdminAccess } from '@/lib/auth/require-admin-access';
import {
  getPrivacyPolicy,
  getTenantHistoryYearsBack,
} from '@/lib/queries/settings/app-settings';

/** Stored (not cached) values, so the form always starts from the database. */
export async function SettingsSection() {
  await requireAdminAccess();
  const [tenantHistoryYearsBack, privacyPolicy] = await Promise.all([
    getTenantHistoryYearsBack(),
    getPrivacyPolicy(),
  ]);

  return (
    <div className={REVEAL_CLASS}>
      <SettingsContent
        initialYearsBack={tenantHistoryYearsBack}
        initialPrivacyPolicy={privacyPolicy}
      />
    </div>
  );
}
