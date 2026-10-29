import { Loader2 } from 'lucide-react';

import { AuthLayout } from '@/components/layout/auth-layout';

export function AuthLoading() {
  return (
    <AuthLayout>
      <div className="flex justify-center py-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AuthLayout>
  );
}
