import { connection } from 'next/server';

import { PolicyText } from '@/components/privacy/policy-text';
import { getPrivacyPolicy } from '@/lib/queries/settings/app-settings';

export const NOT_PUBLISHED_MESSAGE =
  'Polityka prywatności nie została jeszcze opublikowana.';

/** Public: shows the saved policy, or a notice, never the built-in template. */
export async function PrivacyPolicySection() {
  await connection();
  const policy = await getPrivacyPolicy();

  if (!policy) {
    return <p className="text-muted-foreground">{NOT_PUBLISHED_MESSAGE}</p>;
  }

  return <PolicyText text={policy} />;
}
