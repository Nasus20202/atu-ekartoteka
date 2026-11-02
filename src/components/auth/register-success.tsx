import { CheckCircle, Shield } from 'lucide-react';

import { AuthLayout } from '@/components/layout/auth-layout';

export function RegisterSuccess({ isFirstAdmin }: { isFirstAdmin: boolean }) {
  return (
    <AuthLayout
      title={
        isFirstAdmin ? 'Konto administratora utworzone!' : 'Konto utworzone!'
      }
      description={
        isFirstAdmin
          ? 'Twoje konto administratora zostało pomyślnie utworzone. Masz pełny dostęp do systemu.'
          : 'Twoje konto zostało pomyślnie utworzone i oczekuje na zatwierdzenie przez administratora.'
      }
      icon={
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/50">
          {isFirstAdmin ? (
            <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
          ) : (
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          )}
        </div>
      }
    >
      <p className="text-center text-sm text-muted-foreground">
        Trwa automatyczne logowanie...
      </p>
    </AuthLayout>
  );
}
