'use client';

import { useGoogleSignInEnabled } from '@/components/auth/use-google-sign-in-enabled';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/** "Or" divider followed by the Google sign-in button. */
function GoogleSignIn({ onClick }: { onClick: () => void }) {
  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Lub</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onClick}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Zaloguj się przez Google
      </Button>
    </>
  );
}

interface GoogleSignInSlotProps {
  onClick: () => void;
}

/**
 * Reserves the OAuth area until the config is known, so the card does not
 * resize when the Google button appears or disappears.
 */
export function GoogleSignInSlot({ onClick }: GoogleSignInSlotProps) {
  const enabled = useGoogleSignInEnabled();

  if (enabled === null) {
    return (
      <div className="space-y-4" data-testid="google-slot-skeleton">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center">
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        <Skeleton className="h-9 w-[400px]" />
      </div>
    );
  }

  if (!enabled) return null;

  return <GoogleSignIn onClick={onClick} />;
}
