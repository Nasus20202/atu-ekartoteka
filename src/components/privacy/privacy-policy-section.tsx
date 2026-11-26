import { connection } from 'next/server';

import { REVEAL_CLASS } from '@/components/layout/reveal';
import { PolicyText } from '@/components/privacy/policy-text';
import { PolicyToolbar } from '@/components/privacy/policy-toolbar';
import { readPrivacyPolicy } from '@/lib/settings/queries/app-settings';

export const NOT_PUBLISHED_MESSAGE =
  'Polityka prywatności nie została jeszcze opublikowana.';

/** Public: shows the saved policy, or a notice, never the built-in template. */
export async function PrivacyPolicySection() {
  await connection();
  const policy = await readPrivacyPolicy();

  return (
    <div className={REVEAL_CLASS}>
      <PolicyToolbar canPrint={Boolean(policy)} />
      {policy ? (
        <PolicyText text={policy} />
      ) : (
        <p className="text-muted-foreground">{NOT_PUBLISHED_MESSAGE}</p>
      )}
    </div>
  );
}
