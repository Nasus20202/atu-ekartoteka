import Link from 'next/link';

import { cn } from '@/lib/utils';

export const PRIVACY_PATH = '/privacy';
export const PRIVACY_LINK_TEXT = 'Polityka prywatności';

interface PrivacyLinkProps {
  className?: string;
}

export function PrivacyLink({ className }: PrivacyLinkProps) {
  return (
    <Link
      href={PRIVACY_PATH}
      className={cn(
        'inline-flex min-h-11 items-center rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {PRIVACY_LINK_TEXT}
    </Link>
  );
}
