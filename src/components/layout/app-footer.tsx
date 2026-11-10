import packageJson from '@/../package.json';
import { PrivacyLink } from '@/components/privacy/privacy-link';

/**
 * Ends every page in the normal flow, so it sits at the bottom of a short page
 * and under the content of a long one and never covers anything.
 */
export function AppFooter() {
  return (
    <footer className="print:hidden relative z-10 flex min-h-11 items-center justify-between gap-4 px-4 pb-[env(safe-area-inset-bottom)] text-xs sm:px-6">
      <p className="text-muted-foreground/60">v{packageJson.version}</p>
      <PrivacyLink />
    </footer>
  );
}
