import { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
}

/** The card of an auth page; the backdrop comes from the `(auth)` group layout. */
export function AuthLayout({
  children,
  title,
  description,
  icon,
}: AuthLayoutProps) {
  return (
    <Card className="relative z-10 w-full max-w-md shadow-lg dark:border-border animate-scale-in">
      {(title || description || icon) && (
        <CardHeader>
          {icon && <div className="mb-4 flex justify-center">{icon}</div>}
          {title && (
            <CardTitle className="text-center text-2xl font-bold tracking-tight">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-center">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
