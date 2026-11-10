import { connection } from 'next/server';

import { PolicyText } from '@/components/privacy/policy-text';
import { PolicyToolbar } from '@/components/privacy/policy-toolbar';
import { getPrivacyPolicy } from '@/lib/queries/settings/app-settings';

export const NOT_PUBLISHED_MESSAGE =
  'Polityka prywatności nie została jeszcze opublikowana.';

/** Public: shows the saved policy, or a notice, never the built-in template. */
export async function PrivacyPolicySection() {
  await connection();
  const policy = await getPrivacyPolicy();

  return (
    <>
      <PolicyToolbar canPrint={Boolean(policy)} />
      {policy ? (
        <PolicyText text={policy} />
      ) : (
        <p className="text-muted-foreground">{NOT_PUBLISHED_MESSAGE}</p>
      )}
    </>
  );
}
